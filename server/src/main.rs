#[macro_use]
extern crate lazy_static;

mod signal;
mod stun;

fn main() {
    let stun = std::thread::spawn(|| {
        stun::stun_server();
    });
    let signal = std::thread::spawn(|| {
        signal::signalling_server();
    });
    stun.join().unwrap();
    signal.join().unwrap();
}
