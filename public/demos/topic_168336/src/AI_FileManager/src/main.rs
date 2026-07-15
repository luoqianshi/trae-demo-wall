mod app;
mod callbacks;
mod components;
mod pages;
mod types;
mod utils;

use app::App;

fn main() {
    console_error_panic_hook::set_once();
    yew::Renderer::<App>::new().render();
}
