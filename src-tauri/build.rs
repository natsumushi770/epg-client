fn main() {
    // .env ファイルを読み込んでコンパイル時環境変数として埋め込む
    let env_path = std::path::Path::new("../.env");
    println!("cargo:rerun-if-changed=../.env");
    if let Ok(contents) = std::fs::read_to_string(env_path) {
        for line in contents.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if let Some((key, value)) = line.split_once('=') {
                println!("cargo:rustc-env={}={}", key.trim(), value.trim());
            }
        }
    }

    tauri_build::build()
}
