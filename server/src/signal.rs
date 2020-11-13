use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;
use ws::CloseCode;
use ws::Sender;

const SIGNAL_PORT: u16 = 3012;

lazy_static! {
    static ref CLIENTS: Mutex<HashMap<String, Sender>> = Mutex::new(HashMap::new());
}

struct Server {
    id: String,
}

impl ws::Handler for Server {
    fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
        println!("{}", msg);
        let mut toks = msg.as_text()?.splitn(4, ' ');
        let verb = toks.next().unwrap();
        let source_id = toks.next().unwrap();
        if source_id != self.id {
            return Ok(());
        }
        let target_id = toks.next().unwrap();
        match verb {
            "OFFER" | "ANSWER" | "ICE" => {
                if let Some(ref client) = CLIENTS.lock().unwrap().get(target_id) {
                    client.send(msg)?;
                }
            }
            _ => {}
        }
        Ok(())
    }
    fn on_close(&mut self, _code: CloseCode, _reason: &str) {
        CLIENTS.lock().unwrap().remove(&self.id);
    }
}

pub fn signalling_server() {
    ws::Builder::new()
        .build(|out: ws::Sender| {
            let id = Uuid::new_v4().to_simple().to_string();

            out.send(id.clone()).unwrap();
            println!("Saw {}", id.clone());
            CLIENTS.lock().unwrap().insert(id.clone(), out);
            Server { id }
        })
        .unwrap()
        .listen(&format!("0.0.0.0:{}", SIGNAL_PORT))
        .unwrap();
}
