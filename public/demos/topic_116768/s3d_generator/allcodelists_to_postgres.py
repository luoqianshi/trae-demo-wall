#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AllCodeLists.xls -> PostgreSQL 导入脚本
功能：
1. 自动检测Excel结构（简单/分层/多层）
2. 创建目标数据库和统一表结构
3. 导入所有工作表数据
4. 数据规整（去空格、去除Excel浮点.0、空值处理、建立索引）

使用方法：
  python allcodelists_to_postgres.py --password <您的密码>
  python allcodelists_to_postgres.py --host localhost --port 5432 --user postgres --password <密码>
"""

import xlrd
import psycopg2
import psycopg2.extras
import sys
import os
import argparse
from typing import List, Dict, Any

# 默认配置
DEFAULT_HOST = 'localhost'
DEFAULT_PORT = 5432
DEFAULT_USER = 'postgres'
DEFAULT_DB = 'postgres'
TARGET_DATABASE = 's3d_codelists'

# AllCodeLists文件路径（自动查找）
# 优先使用最新的系统库数据文件
ALLCODELISTS_PATHS = [
    r"c:\Users\admin\Desktop\3D\0-S3D资料\1-20240321\资料\1-管道建库\Sheets\24019S3D材料建库\1-系统库数据\AllCodeLists.xls",
    r"c:\Users\admin\Desktop\3D\0-S3D资料\1-20240321\资料\1-管道建库\Sheets\20260101原始资料\AllCodeLists.xls",
    r"c:\Users\admin\.trae-cn\attachments\6a2a2a08aa7a31e046499056\49414d00-061e-4923-9a43-03fa71a46521_62e62096-9e3a-4594-836c-b2f79c52a253_AllCodeLists.xls",
]


def find_allcodelists_file() -> str:
    """查找AllCodeLists文件"""
    for path in ALLCODELISTS_PATHS:
        if os.path.exists(path):
            return path
    # 在当前目录查找
    for f in os.listdir('.'):
        if f.lower().startswith('allcodelists') and f.lower().endswith('.xls'):
            return os.path.abspath(f)
    return None


class AllCodeListsImporter:
    def __init__(self, db_config: Dict[str, Any], xls_path: str):
        self.db_config = db_config
        self.xls_path = xls_path
        self.conn = None
        self.cur = None
        self.wb = None
        self.stats = {
            'total_sheets': 0,
            'imported_sheets': 0,
            'skipped_sheets': 0,
            'total_rows': 0,
            'cleaned_rows': 0,
            'errors': []
        }

    def connect_db(self):
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.conn.autocommit = True
            self.cur = self.conn.cursor()
            print(f"连接成功: {self.db_config['host']}:{self.db_config['port']}")
            return True
        except Exception as e:
            print(f"连接失败: {e}")
            return False

    def create_target_database(self):
        try:
            self.cur.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (TARGET_DATABASE,)
            )
            if not self.cur.fetchone():
                self.cur.execute(f"CREATE DATABASE {TARGET_DATABASE}")
                print(f"创建数据库: {TARGET_DATABASE}")
            else:
                print(f"数据库已存在: {TARGET_DATABASE}")

            self.conn.close()
            cfg = self.db_config.copy()
            cfg['database'] = TARGET_DATABASE
            self.conn = psycopg2.connect(**cfg)
            self.conn.autocommit = False
            self.cur = self.conn.cursor()
            return True
        except Exception as e:
            print(f"创建数据库失败: {e}")
            return False

    def create_tables(self):
        sql = """
        DROP TABLE IF EXISTS code_entries CASCADE;
        DROP TABLE IF EXISTS code_sheets CASCADE;
        DROP TABLE IF EXISTS import_log CASCADE;

        CREATE TABLE code_sheets (
            id SERIAL PRIMARY KEY,
            sheet_name VARCHAR(100) NOT NULL UNIQUE,
            sheet_type VARCHAR(50),
            total_rows INTEGER DEFAULT 0,
            data_rows INTEGER DEFAULT 0,
            column_count INTEGER DEFAULT 0,
            start_row INTEGER DEFAULT NULL,
            header_row INTEGER DEFAULT NULL,
            parent_column_count INTEGER DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE code_entries (
            id SERIAL PRIMARY KEY,
            sheet_name VARCHAR(100) NOT NULL,
            sheet_id INTEGER REFERENCES code_sheets(id),
            level INTEGER DEFAULT 1,
            is_parent BOOLEAN DEFAULT FALSE,
            parent_code VARCHAR(100),
            short_description VARCHAR(500),
            long_description VARCHAR(1000),
            code_number VARCHAR(50),
            sort_order VARCHAR(50),
            raw_data JSONB,
            is_cleaned BOOLEAN DEFAULT FALSE,
            original_short_desc VARCHAR(500),
            original_long_desc VARCHAR(1000),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE import_log (
            id SERIAL PRIMARY KEY,
            log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            log_level VARCHAR(20),
            message TEXT
        );

        CREATE INDEX idx_code_entries_sheet ON code_entries(sheet_name);
        CREATE INDEX idx_code_entries_sheet_id ON code_entries(sheet_id);
        CREATE INDEX idx_code_entries_code_number ON code_entries(code_number);
        CREATE INDEX idx_code_entries_short_desc ON code_entries(short_description);
        CREATE INDEX idx_code_entries_parent ON code_entries(parent_code);
        CREATE INDEX idx_code_entries_level ON code_entries(level);
        CREATE INDEX idx_code_sheets_name ON code_sheets(sheet_name);
        """
        try:
            self.cur.execute(sql)
            self.conn.commit()
            print("表结构创建成功")
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"创建表失败: {e}")
            return False

    def log(self, level: str, message: str):
        try:
            self.cur.execute(
                "INSERT INTO import_log (log_level, message) VALUES (%s, %s)",
                (level, message)
            )
            self.conn.commit()
        except:
            pass
        if level == 'ERROR':
            self.stats['errors'].append(message)
        print(f"[{level}] {message}")

    def detect_structure(self, ws) -> Dict[str, Any]:
        info = {'nrows': ws.nrows, 'ncols': ws.ncols, 'start_row': None,
                'header_row': None, 'sheet_type': 'simple', 'parent_cols': 0}
        for row_idx in range(min(20, ws.nrows)):
            for col_idx in range(ws.ncols):
                if str(ws.cell_value(row_idx, col_idx)).strip().upper() == 'START':
                    info['start_row'] = row_idx
                    break
            if info['start_row'] is not None:
                break
        for row_idx in range(min(20, ws.nrows)):
            if str(ws.cell_value(row_idx, 0)).strip().upper() == 'HEAD':
                info['header_row'] = row_idx
                headers = [str(ws.cell_value(row_idx, c)).strip() for c in range(ws.ncols)]
                pc = 0
                for hv in headers:
                    hu = hv.upper()
                    if ('PRACTICE' in hu and 'SHORT' in hu) or \
                       ('CLASS' in hu and 'SHORT' in hu) or \
                       ('CATEGORY' in hu and 'SHORT' in hu):
                        pc += 1
                info['parent_cols'] = pc
                if pc >= 2:
                    info['sheet_type'] = 'multi_level'
                elif pc == 1:
                    info['sheet_type'] = 'hierarchical'
                else:
                    info['sheet_type'] = 'simple'
                break
        return info

    def clean(self, row: Dict) -> Dict:
        c = row.copy()
        c['original_short_desc'] = c.get('short_description', '')
        c['original_long_desc'] = c.get('long_description', '')
        for k in ['short_description', 'long_description', 'code_number', 'sort_order', 'parent_code']:
            if k in c and c[k]:
                c[k] = str(c[k]).strip()
        if not c.get('long_description'):
            c['long_description'] = c.get('short_description', '')
        for k in ['code_number', 'sort_order']:
            if c.get(k):
                v = c[k]
                if v.endswith('.0'):
                    v = v[:-2]
                try:
                    v = str(int(float(v)))
                except:
                    pass
                c[k] = v
        c['is_cleaned'] = True
        self.stats['cleaned_rows'] += 1
        return c

    def extract_simple(self, ws, start_row: int) -> List[Dict]:
        rows = []
        for r in range(start_row + 1, ws.nrows):
            sd = str(ws.cell_value(r, 1)).strip() if ws.ncols > 1 else ''
            ld = str(ws.cell_value(r, 2)).strip() if ws.ncols > 2 else ''
            cn = str(ws.cell_value(r, 3)).strip() if ws.ncols > 3 else ''
            so = str(ws.cell_value(r, 4)).strip() if ws.ncols > 4 else ''
            if not sd and not cn:
                continue
            rows.append(self.clean({'short_description': sd, 'long_description': ld or sd,
                                     'code_number': cn, 'sort_order': so}))
        return rows

    def extract_hierarchical(self, ws, start_row: int) -> List[Dict]:
        rows = []
        parent = None
        for r in range(start_row + 1, ws.nrows):
            ps = str(ws.cell_value(r, 1)).strip() if ws.ncols > 1 else ''
            pl = str(ws.cell_value(r, 2)).strip() if ws.ncols > 2 else ''
            cs = str(ws.cell_value(r, 3)).strip() if ws.ncols > 3 else ''
            cl = str(ws.cell_value(r, 4)).strip() if ws.ncols > 4 else ''
            cn = str(ws.cell_value(r, 5)).strip() if ws.ncols > 5 else ''
            so = str(ws.cell_value(r, 6)).strip() if ws.ncols > 6 else ''
            if ps and not cs:
                parent = {'short_description': ps, 'long_description': pl or ps,
                          'code_number': cn, 'sort_order': so, 'level': 1, 'is_parent': True}
                rows.append(self.clean(parent))
            elif cs:
                rows.append(self.clean({'short_description': cs, 'long_description': cl or cs,
                                         'code_number': cn, 'sort_order': so, 'level': 2,
                                         'is_parent': False, 'parent_code': parent['code_number'] if parent else None}))
        return rows

    def extract_multi(self, ws, start_row: int) -> List[Dict]:
        rows = []
        for r in range(start_row + 1, ws.nrows):
            vals = [str(ws.cell_value(r, c)).strip() for c in range(ws.ncols)]
            cn = vals[-2] if len(vals) >= 2 else ''
            so = vals[-1] if len(vals) >= 1 else ''
            descs = [v for v in vals[:-2] if v]
            if not descs:
                continue
            level, is_parent, parent_code = 1, False, None
            if not cn and descs:
                is_parent, level = True, 1
            elif cn:
                ne = [v for v in vals[:-2] if v]
                level = 3 if len(ne) >= 3 else (2 if len(ne) >= 2 else 1)
                if level == 1:
                    is_parent = True
            sd = descs[-1]
            rows.append(self.clean({'short_description': sd, 'long_description': sd,
                                     'code_number': cn, 'sort_order': so,
                                     'level': level, 'is_parent': is_parent, 'parent_code': parent_code}))
        return rows

    def import_sheet(self, sheet_name: str):
        try:
            ws = self.wb.sheet_by_name(sheet_name)
            st = self.detect_structure(ws)
            sr = st['start_row']
            if sr is None:
                self.stats['skipped_sheets'] += 1
                self.log('WARN', f"跳过（无START行）: {sheet_name}")
                return False

            self.cur.execute("""
                INSERT INTO code_sheets (sheet_name, sheet_type, total_rows, data_rows, column_count, start_row, header_row, parent_column_count)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (sheet_name) DO UPDATE SET
                    sheet_type=EXCLUDED.sheet_type, total_rows=EXCLUDED.total_rows,
                    data_rows=EXCLUDED.data_rows, column_count=EXCLUDED.column_count,
                    start_row=EXCLUDED.start_row, header_row=EXCLUDED.header_row,
                    parent_column_count=EXCLUDED.parent_column_count
                RETURNING id
            """, (sheet_name, st['sheet_type'], ws.nrows, ws.nrows - sr - 1,
                  ws.ncols, sr, st.get('header_row'), st['parent_cols']))
            sheet_id = self.cur.fetchone()[0]
            self.conn.commit()

            if st['sheet_type'] == 'simple':
                rows = self.extract_simple(ws, sr)
            elif st['sheet_type'] == 'hierarchical':
                rows = self.extract_hierarchical(ws, sr)
            else:
                rows = self.extract_multi(ws, sr)

            if rows:
                vals = [(sheet_name, sheet_id, r.get('level', 1), r.get('is_parent', False),
                         r.get('parent_code'), r.get('short_description'), r.get('long_description'),
                         r.get('code_number'), r.get('sort_order'), r.get('original_short_desc'),
                         r.get('original_long_desc'), r.get('is_cleaned', False)) for r in rows]
                psycopg2.extras.execute_values(self.cur, """
                    INSERT INTO code_entries
                    (sheet_name, sheet_id, level, is_parent, parent_code,
                     short_description, long_description, code_number, sort_order,
                     original_short_desc, original_long_desc, is_cleaned)
                    VALUES %s
                """, vals, page_size=1000)
                self.conn.commit()

            self.stats['imported_sheets'] += 1
            self.stats['total_rows'] += len(rows)
            self.log('INFO', f"导入: {sheet_name} | {st['sheet_type']} | {len(rows)}行")
            return True
        except Exception as e:
            self.conn.rollback()
            self.stats['skipped_sheets'] += 1
            self.log('ERROR', f"失败: {sheet_name} - {e}")
            return False

    def run(self):
        print("=" * 50)
        print("AllCodeLists -> PostgreSQL 导入工具")
        print("=" * 50)

        if not self.connect_db():
            return False
        if not self.create_target_database():
            return False
        if not self.create_tables():
            return False

        print(f"\n打开Excel: {self.xls_path}")
        try:
            self.wb = xlrd.open_workbook(self.xls_path, formatting_info=False)
            names = self.wb.sheet_names()
            self.stats['total_sheets'] = len(names)
            print(f"共 {len(names)} 个工作表")
        except Exception as e:
            print(f"打开失败: {e}")
            return False

        print("\n开始导入...")
        for idx, name in enumerate(names, 1):
            if name in ['Index', 'Revision History']:
                continue
            self.import_sheet(name)
            if idx % 10 == 0:
                print(f"  进度: {idx}/{len(names)}")

        print("\n创建索引...")
        try:
            self.cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_code_entries_lookup
                ON code_entries(sheet_name, code_number, short_description);
            """)
            self.conn.commit()
            print("索引创建成功")
        except Exception as e:
            print(f"索引警告: {e}")

        print("\n更新统计...")
        try:
            self.cur.execute("""
                UPDATE code_sheets cs SET data_rows = (
                    SELECT COUNT(*) FROM code_entries ce WHERE ce.sheet_id = cs.id
                );
            """)
            self.conn.commit()
        except Exception as e:
            print(f"统计警告: {e}")

        print("\n" + "=" * 50)
        print("导入完成")
        print("=" * 50)
        print(f"总工作表: {self.stats['total_sheets']}")
        print(f"成功导入: {self.stats['imported_sheets']}")
        print(f"跳过/失败: {self.stats['skipped_sheets']}")
        print(f"总数据行: {self.stats['total_rows']}")
        print(f"已清洗: {self.stats['cleaned_rows']}")
        if self.stats['errors']:
            print(f"错误: {len(self.stats['errors'])}")
            for e in self.stats['errors'][:5]:
                print(f"  - {e}")

        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()
        return True


def main():
    parser = argparse.ArgumentParser(description='AllCodeLists导入PostgreSQL工具')
    parser.add_argument('--host', default=DEFAULT_HOST, help='数据库主机')
    parser.add_argument('--port', type=int, default=DEFAULT_PORT, help='数据库端口')
    parser.add_argument('--user', default=DEFAULT_USER, help='数据库用户')
    parser.add_argument('--password', required=True, help='数据库密码（必填）')
    parser.add_argument('--database', default=DEFAULT_DB, help='默认数据库')
    parser.add_argument('--file', help='AllCodeLists文件路径（可选，自动查找）')
    args = parser.parse_args()

    # 查找文件
    xls_path = args.file or find_allcodelists_file()
    if not xls_path or not os.path.exists(xls_path):
        print(f"未找到AllCodeLists.xls文件")
        print(f"请使用 --file 参数指定文件路径")
        sys.exit(1)

    db_config = {
        'host': args.host,
        'port': args.port,
        'database': args.database,
        'user': args.user,
        'password': args.password,
    }

    importer = AllCodeListsImporter(db_config, xls_path)
    if importer.run():
        print("\n导入成功!")
        print(f"数据库: {TARGET_DATABASE}")
        print("表: code_sheets, code_entries, import_log")
        sys.exit(0)
    else:
        print("\n导入失败")
        sys.exit(1)


if __name__ == '__main__':
    main()
