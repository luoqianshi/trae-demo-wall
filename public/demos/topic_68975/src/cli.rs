use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
#[command(about = "A Git diff tool for Office documents that preserves formatting")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand)]
pub enum Command {
    /// Parse a .docx file and output its structure as JSON
    Parse {
        /// Input .docx file path
        #[arg(value_name = "INPUT")]
        input: PathBuf,

        /// Output JSON file path (default: stdout)
        #[arg(short, long, value_name = "OUTPUT")]
        output: Option<PathBuf>,
    },
}
