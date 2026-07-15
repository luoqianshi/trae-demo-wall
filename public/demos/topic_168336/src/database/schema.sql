-- 文件元数据表
CREATE TABLE file_metadata (
    id SERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    md5_hash CHAR(32) NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    size BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 虚拟目录表
CREATE TABLE virtual_directories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES virtual_directories(id),
    ai_generated BOOLEAN DEFAULT FALSE
);

-- 虚拟目录文件映射表
CREATE TABLE virtual_dir_files (
    virtual_dir_id INTEGER REFERENCES virtual_directories(id),
    file_id INTEGER REFERENCES file_metadata(id),
    PRIMARY KEY (virtual_dir_id, file_id)
);

-- 删除记录表
CREATE TABLE deletion_records (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES file_metadata(id),
    deleted_at TIMESTAMP NOT NULL,
    reason TEXT,
    is_physical_deleted BOOLEAN DEFAULT FALSE
); 