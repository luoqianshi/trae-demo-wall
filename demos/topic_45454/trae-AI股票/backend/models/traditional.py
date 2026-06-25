"""
传统机器学习模型：线性回归 / 随机森林
将时序窗口展平为二维特征进行训练
"""
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor


class TraditionalModels:
    @staticmethod
    def train(model_id, data, params):
        X_train = data["X_train"]
        y_train = data["y_train"].reshape(-1)
        X_test = data["X_test"]
        y_test = data["y_test"].reshape(-1)

        # 展平滑动窗口: (n, time_step, 1) -> (n, time_step)
        X_train_flat = X_train.reshape(X_train.shape[0], -1)
        X_test_flat = X_test.reshape(X_test.shape[0], -1)

        if model_id == "linear":
            model = LinearRegression()
        elif model_id == "random_forest":
            model = RandomForestRegressor(
                n_estimators=params.get("n_estimators", 100),
                random_state=42,
                n_jobs=-1,
            )
        else:
            raise ValueError(f"未知传统模型: {model_id}")

        model.fit(X_train_flat, y_train)
        y_pred = model.predict(X_test_flat)

        return {
            "y_true": y_test.tolist(),
            "y_pred": y_pred.tolist(),
            "history": [],
            "attention": None,
        }
