use rustun::server::{BindingHandler, UdpServer};

pub fn stun_server() {
    let addr = "0.0.0.0:3478".parse().unwrap();
    let server = fibers_global::execute(UdpServer::start(
        fibers_global::handle(),
        addr,
        BindingHandler,
    ))
    .unwrap();
    fibers_global::execute(server).unwrap();
}
