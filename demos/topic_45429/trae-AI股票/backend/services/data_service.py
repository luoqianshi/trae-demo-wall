"""
数据服务：文件加载、预览、数据库查询、训练/测试拆分、列聚合统计
支持 CSV / Excel / JSON 三种格式
"""
import os
import uuid
import numpy as np
import pandas as pd
from flask import current_app
from services.db_service import db_service


class DataService:
    # ============ 文件操作 ============
    @staticmethod
    def save_upload(file_storage, role="train"):
        """保存上传文件，返回绝对路径"""
        ext = file_storage.filename.rsplit(".", 1)[-1].lower()
        filename = f"{role}_{uuid.uuid4().hex[:8]}.{ext}"
        folder = current_app.config["UPLOAD_FOLDER"]
        path = os.path.join(folder, filename)
        file_storage.save(path)
        return path

    @staticmethod
    def load_file(path):
        """根据扩展名加载文件为 DataFrame"""
        ext = path.rsplit(".", 1)[-1].lower()
        if ext == "csv":
            return pd.read_csv(path)
        if ext in ("xlsx", "xls"):
            return pd.read_excel(path)
        if ext == "json":
            return pd.read_json(path)
        raise ValueError(f"不支持的文件格式: {ext}")

    @staticmethod
    def load_preview(path, n=10):
        """加载文件并返回预览信息（前 n 行 + 字段类型）"""
        df = DataService.load_file(path)
        return {
            "path": path,
            "rows": int(len(df)),
            "columns": list(df.columns),
            "dtypes": {c: str(t) for c, t in df.dtypes.items()},
            "preview": df.head(n).fillna("").to_dict(orient="records"),
        }

    @staticmethod
    def split_and_save(df, ratio=0.8):
        """将 DataFrame 按比例拆分为训练/测试集并保存为 CSV"""
        from flask import current_app
        folder = current_app.config["UPLOAD_FOLDER"]
        split_idx = int(len(df) * ratio)
        train_path = os.path.join(folder, f"mock_train_{uuid.uuid4().hex[:6]}.csv")
        test_path = os.path.join(folder, f"mock_test_{uuid.uuid4().hex[:6]}.csv")
        df.iloc[:split_idx].to_csv(train_path, index=False)
        df.iloc[split_idx:].to_csv(test_path, index=False)
        return train_path, test_path

    # ============ 数据库操作 ============
    @staticmethod
    def test_db_connection(cfg):
        """测试数据库连接"""
        return db_service.test_connection(cfg)

    @staticmethod
    def list_tables(cfg):
        """列出数据库所有表"""
        return db_service.list_tables(cfg=cfg)

    @staticmethod
    def get_table_schema(table_name, cfg):
        """获取表结构"""
        return db_service.get_table_schema(table_name, cfg=cfg)

    @staticmethod
    def query_database(sql, cfg=None):
        """执行 SQL 查询"""
        return db_service.execute_query(sql, cfg=cfg)

    # ============ 列聚合统计 ============
    @staticmethod
    def aggregate_columns(table_name, columns, agg_funcs, cfg):
        """对数据库表的指定列执行聚合统计"""
        # 构造 {column: [funcs]} 结构
        agg_dict = {col: agg_funcs for col in columns}
        return db_service.aggregate_columns(table_name, columns, agg_dict, cfg=cfg)

    @staticmethod
    def aggregate_file(path, columns, agg_funcs):
        """对上传文件的指定列执行聚合统计（基于 Pandas）"""
        df = DataService.load_file(path)
        result = {}
        for col in columns:
            if col not in df.columns:
                result[col] = {"error": "列不存在"}
                continue
            series = pd.to_numeric(df[col], errors="coerce").dropna()
            stats = {}
            for fn in agg_funcs:
                fn = fn.lower()
                if fn == "avg":
                    stats["avg"] = float(series.mean()) if len(series) else None
                elif fn == "max":
                    stats["max"] = float(series.max()) if len(series) else None
                elif fn == "min":
                    stats["min"] = float(series.min()) if len(series) else None
                elif fn == "sum":
                    stats["sum"] = float(series.sum()) if len(series) else None
                elif fn == "count":
                    stats["count"] = int(series.count())
                elif fn == "std":
                    stats["std"] = float(series.std()) if len(series) > 1 else None
                elif fn == "median":
                    stats["median"] = float(series.median()) if len(series) else None
                elif fn == "var":
                    stats["var"] = float(series.var()) if len(series) > 1 else None
            result[col] = stats
        return result
