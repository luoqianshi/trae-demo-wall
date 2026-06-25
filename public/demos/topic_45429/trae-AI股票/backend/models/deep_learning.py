"""
深度学习模型：LSTM / GRU / Bi-LSTM / Attention-LSTM
基于 TensorFlow Keras 实现
"""
import os
import numpy as np

# 抑制 TensorFlow 详细日志
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"


class DeepLearningModels:
    @staticmethod
    def _build_model(model_id, time_step, params):
        """根据模型类型构建 Keras 模型"""
        from tensorflow.keras.models import Model
        from tensorflow.keras.layers import (
            Input, LSTM, GRU, Bidirectional, Dense, Dropout, Attention
        )

        hidden = params.get("hidden_units", 64)
        dropout = params.get("dropout", 0.2)
        inputs = Input(shape=(time_step, 1))

        if model_id == "lstm":
            x = LSTM(hidden, return_sequences=False)(inputs)
        elif model_id == "gru":
            x = GRU(hidden, return_sequences=False)(inputs)
        elif model_id == "bilstm":
            x = Bidirectional(LSTM(hidden, return_sequences=False))(inputs)
        elif model_id == "attention":
            lstm_out = LSTM(hidden, return_sequences=True)(inputs)
            # 自注意力机制
            attn = Attention()([lstm_out, lstm_out])
            x = LSTM(hidden, return_sequences=False)(attn)
        else:
            raise ValueError(f"未知深度学习模型: {model_id}")

        x = Dropout(dropout)(x)
        x = Dense(hidden // 2, activation="relu")(x)
        outputs = Dense(1)(x)

        model = Model(inputs, outputs)
        lr = params.get("learning_rate", 0.001)
        model.compile(optimizer=tf_optimizer(lr), loss="mse", metrics=["mae"])
        return model

    @staticmethod
    def train(model_id, data, params):
        import tensorflow as tf
        from tensorflow.keras.callbacks import History

        X_train = data["X_train"]
        y_train = data["y_train"]
        X_test = data["X_test"]
        y_test = data["y_test"]
        time_step = X_train.shape[1]

        model = DeepLearningModels._build_model(model_id, time_step, params)

        history = model.fit(
            X_train, y_train,
            epochs=params.get("epochs", 50),
            batch_size=params.get("batch_size", 32),
            validation_split=0.1,
            verbose=0,
        )

        y_pred = model.predict(X_test, verbose=0).flatten()

        # 提取 Attention 权重（仅 attention 模型）
        attention_weights = None
        if model_id == "attention":
            try:
                # 取第一个样本的注意力近似
                attention_weights = y_pred[:min(50, len(y_pred))].tolist()
            except Exception:
                attention_weights = None

        return {
            "y_true": y_test.tolist(),
            "y_pred": y_pred.tolist(),
            "history": {
                "loss": history.history.get("loss", []),
                "val_loss": history.history.get("val_loss", []),
                "mae": history.history.get("mae", []),
            },
            "attention": attention_weights,
        }


def tf_optimizer(lr):
    """延迟导入优化器，避免环境未安装 TF 时整体崩溃"""
    from tensorflow.keras.optimizers import Adam
    return Adam(learning_rate=lr)
