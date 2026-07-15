"""配置管理测试"""
import os
import tempfile
import pytest
from readmate.core.config import Config


def test_config_singleton():
    """测试配置单例"""
    c1 = Config()
    c2 = Config()
    assert c1 is c2


def test_config_default_values():
    """测试默认配置值"""
    cfg = Config()
    assert cfg.get("minimax_model", "") == "MiniMax-M3"
    assert cfg.get("popup_timeout", 0) == 5.0
    assert cfg.get("max_history_records", 0) == 1000


def test_config_env_override():
    """测试环境变量覆盖"""
    os.environ["READMATE_MINIMAX_MODEL"] = "test-model"
    cfg = Config()
    cfg.load()
    assert cfg.get("minimax_model", "") == "test-model"
    del os.environ["READMATE_MINIMAX_MODEL"]
    cfg.load()


def test_config_set_and_get():
    """测试设置和读取"""
    cfg = Config()
    cfg.set("test_key", "test_value")
    assert cfg.get("test_key") == "test_value"
