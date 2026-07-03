use clap::Parser;
use offdiff::cli::Cli;

fn main() {
    let cli = Cli::parse();
    if let Err(e) = offdiff::run(cli) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
