"""
模型服务：统一调度传统机器学习与深度学习模型
负责数据预处理、训练、预测、评估、可视化数据生成
"""
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from services.data_service import DataService
from models.traditional import TraditionalModels
from models.deep_learning import DeepLearningModels


class ModelService:
    # 评估指标计算
    @staticmethod
    def _metrics(y_true, y_pred):
        y_true = np.array(y_true, dtype=float)
        y_pred = np.array(y_pred, dtype=float)
        mae = float(np.mean(np.abs(y_true - y_pred)))
        mse = float(np.mean((y_true - y_pred) ** 2))
        rmse = float(np.sqrt(mse))
        # 避免除零
        denom = np.mean(np.abs(y_true))
        mape = float(np.mean(np.abs((y_true - y_pred) / np.where(denom == 0, 1, y_true)))) * 100 if denom != 0 else 0.0
        r2 = 1 - float(np.sum((y_true - y_pred) ** 2) / np.sum((y_true - np.mean(y_true)) ** 2)) if np.var(y_true) != 0 else 0.0
        return {"MAE": mae, "MSE": mse, "RMSE": rmse, "MAPE": mape, "R2": r2}

    @staticmethod
    def _prepare_data(train_path, test_path, time_step=30, target="close"):
        """加载数据、归一化、构造滑动窗口样本"""
        train_df = DataService.load_file(train_path)
        test_df = DataService.load_file(test_path) if test_path else None

        # 目标列兼容
        if target not in train_df.columns:
            target = train_df.select_dtypes(include=[np.number]).columns[-1]

        # 合并后统一缩放，再按原比例拆分
        full = pd_concat(train_df, test_df)
        values = full[[target]].values.astype(float)

        scaler = MinMaxScaler()
        scaled = scaler.fit_transform(values)

        n_train = len(train_df)
        X_train, y_train = _make_windows(scaled[:n_train], time_step)
        if test_df is not None:
            X_test, y_test = _make_windows(scaled[n_train - time_step:], time_step)
        else:
            X_test, y_test = X_train, y_train

        return {
            "X_train": X_train, "y_train": y_train,
            "X_test": X_test, "y_test": y_test,
            "scaler": scaler, "target": target,
            "train_df": train_df, "test_df": test_df,
        }

    @staticmethod
    def train_and_predict(model_id, train_path, test_path=None, params=None):
        """训练指定模型并返回预测结果 + 评估指标"""
        from config import Config
        default = Config.DEFAULT_MODEL_PARAMS.copy()
        if params:
            default.update(params)
        params = default

        data = ModelService._prepare_data(train_path, test_path, params["time_step"])

        if model_id in ("linear", "random_forest"):
            result = TraditionalModels.train(model_id, data, params)
        else:
            result = DeepLearningModels.train(model_id, data, params)

        # 反归一化
        scaler = data["scaler"]
        y_true_inv = scaler.inverse_transform(np.array(result["y_true"]).reshape(-1, 1)).flatten()
        y_pred_inv = scaler.inverse_transform(np.array(result["y_pred"]).reshape(-1, 1)).flatten()

        metrics = ModelService._metrics(y_true_inv, y_pred_inv)
        return {
            "model_id": model_id,
            "params": params,
            "y_true": y_true_inv.tolist(),
            "y_pred": y_pred_inv.tolist(),
            "metrics": metrics,
            "history": result.get("history", []),
            "attention": result.get("attention"),
        }

    @staticmethod
    def get_forecast_data(payload):
        """生成历史 + 预测叠加数据（供前端 ECharts 渲染）"""
        result = payload.get("result", {})
        return {
            "y_true": result.get("y_true", []),
            "y_pred": result.get("y_pred", []),
        }

    @staticmethod
    def get_error_distribution(payload):
        """生成误差分布数据"""
        import numpy as np
        y_true = np.array(payload.get("result", {}).get("y_true", []))
        y_pred = np.array(payload.get("result", {}).get("y_pred", []))
        if len(y_true) == 0:
            return {"errors": [], "bins": [], "counts": []}
        errors = (y_true - y_pred).tolist()
        counts, bins = np.histogram(errors, bins=20)
        return {
            "errors": errors,
            "bins": bins.tolist(),
            "counts": counts.tolist(),
        }

    @staticmethod
    def get_attention_weights(payload):
        """返回 Attention 权重矩阵（若模型支持）"""
        return {"attention": payload.get("result", {}).get("attention")}

    @staticmethod
    def get_metrics_comparison(payload):
        """多模型评估指标对比"""
        results = payload.get("results", [])
        return {
            "models": [r.get("model_id") for r in results],
            "metrics": {m: [r.get("metrics", {}).get(m, 0) for r in results]
                        for m in ["MAE", "MSE", "RMSE", "MAPE", "R2"]},
        }


# ---------- 辅助函数 ----------
def pd_concat(train_df, test_df):
    import pandas as pd
    if test_df is not None:
        return pd.concat([train_df, test_df], ignore_index=True)
    return train_df


def _make_windows(data, time_step):
    """构造滑动窗口样本: X[i] = data[i:i+time_step], y[i] = data[i+time_step]"""
    X, y = [], []
    for i in range(len(data) - time_step):
        X.append(data[i:i + time_step])
        y.append(data[i + time_step])
    return np.array(X), np.array(y)
