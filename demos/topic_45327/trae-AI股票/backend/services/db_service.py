"""
数据库服务：统一封装 MySQL / SQLite 访问
通过 SQLAlchemy 实现，配置见 config.py
支持：表结构浏览、自定义连接、SQL 查询、列聚合统计
"""
from sqlalchemy import create_engine, text, inspect
from config import Config


class DBService:
    def __init__(self):
        self._engine = None
        # 缓存自定义连接的引擎: key -> engine
        self._custom_engines = {}

    @property
    def engine(self):
        """默认引擎（来自 config.py 配置）"""
        if self._engine is None:
            self._engine = create_engine(
                Config().SQLALCHEMY_DATABASE_URI,
                echo=False,
                pool_pre_ping=True,
            )
        return self._engine

    def _build_uri(self, cfg):
        """根据连接参数构建 SQLAlchemy URI"""
        db_type = cfg.get("db_type", "sqlite")
        if db_type == "mysql":
            return (
                f"mysql+pymysql://{cfg.get('user','root')}:{cfg.get('password','')}"
                f"@{cfg.get('host','127.0.0.1')}:{cfg.get('port',3306)}"
                f"/{cfg.get('database','')}?charset=utf8mb4"
            )
        if db_type == "sqlite":
            return f"sqlite:///{cfg.get('database','ai_zhigu.db')}"
        if db_type == "postgresql":
            return (
                f"postgresql+psycopg2://{cfg.get('user','postgres')}:{cfg.get('password','')}"
                f"@{cfg.get('host','127.0.0.1')}:{cfg.get('port',5432)}/{cfg.get('database','')}"
            )
        raise ValueError(f"不支持的数据库类型: {db_type}")

    def get_engine_for(self, conn_id="default", cfg=None):
        """获取指定连接的引擎；cfg 提供时创建并缓存新连接"""
        if conn_id == "default":
            return self.engine
        if cfg and conn_id not in self._custom_engines:
            uri = self._build_uri(cfg)
            self._custom_engines[conn_id] = create_engine(uri, echo=False, pool_pre_ping=True)
        return self._custom_engines.get(conn_id, self.engine)

    def test_connection(self, cfg):
        """测试数据库连接是否可用"""
        try:
            uri = self._build_uri(cfg)
            eng = create_engine(uri, echo=False)
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            eng.dispose()
            return True, "连接成功"
        except Exception as e:
            return False, str(e)

    def list_tables(self, conn_id="default", cfg=None):
        """列出数据库中的所有表"""
        engine = self.get_engine_for(conn_id, cfg)
        insp = inspect(engine)
        return insp.get_table_names()

    def get_table_schema(self, table_name, conn_id="default", cfg=None):
        """获取指定表的字段结构"""
        engine = self.get_engine_for(conn_id, cfg)
        insp = inspect(engine)
        columns = []
        for col in insp.get_columns(table_name):
            columns.append({
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": col.get("nullable", True),
                "primary_key": False,
            })
        # 主键信息
        try:
            pk = insp.get_pk_constraint(table_name).get("constrained_columns", [])
            for c in columns:
                if c["name"] in pk:
                    c["primary_key"] = True
        except Exception:
            pass
        return columns

    def execute_query(self, sql, conn_id="default", cfg=None):
        """执行 SELECT 语句，返回 (rows, columns)"""
        engine = self.get_engine_for(conn_id, cfg)
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            columns = list(result.keys())
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return rows, columns

    def aggregate_columns(self, table_name, columns, agg_funcs, conn_id="default", cfg=None):
        """
        对指定列执行聚合统计
        agg_funcs: dict { column_name: ["avg","max","min","sum","count","std"] }
        """
        engine = self.get_engine_for(conn_id, cfg)
        agg_map = {
            "avg": "AVG",
            "max": "MAX",
            "min": "MIN",
            "sum": "SUM",
            "count": "COUNT",
            "std": "STDDEV",
        }
        select_parts = []
        result_keys = []
        for col, funcs in agg_funcs.items():
            for fn in funcs:
                sql_fn = agg_map.get(fn.lower(), fn.upper())
                alias = f"{fn}_{col}"
                select_parts.append(f'{sql_fn}("{col}") AS "{alias}"')
                result_keys.append(alias)

        sql = f'SELECT {", ".join(select_parts)} FROM "{table_name}"'
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            row = result.fetchone()
        return {k: (None if row[k] is None else float(row[k])) for k in result_keys}

    def save_dataframe(self, df, table_name, if_exists="replace", conn_id="default", cfg=None):
        """将 DataFrame 写入数据库表"""
        engine = self.get_engine_for(conn_id, cfg)
        df.to_sql(table_name, engine, if_exists=if_exists, index=False)


db_service = DBService()
