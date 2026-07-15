//! 页面模块导出

mod classification;
mod dashboard;
mod deletion;
mod duplicates;
mod integration;
mod scanner;
mod search;
mod settings;
mod virtual_dirs;
mod tags;
mod recent_files;
mod batch_ops;
mod sort_filter;
mod file_ops;
mod data_io;

pub use classification::render_classification;
pub use dashboard::render_dashboard;
pub use deletion::render_deletion;
pub use duplicates::render_duplicates;
pub use integration::render_integration;
pub use scanner::render_scanner;
pub use search::render_search;
pub use settings::render_settings;
pub use virtual_dirs::render_virtual_dirs;
pub use tags::render_tags;
pub use recent_files::render_recent_files;
pub use batch_ops::render_batch_ops;
pub use sort_filter::render_sort_filter;
pub use file_ops::render_file_ops;
pub use data_io::render_data_io;