class Field {
  constructor(canvas, users, id) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
    this.users = users;
    this.id = id
  }
  clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  render() {
    this.clear();

    for (const user in users) {
      console.log(users)
      if(user == this.id) {
        ctx.fillStyle = "red";
      } else {
        ctx.fillStyle = "blue";
      }
      ctx.fillRect(users[user].x, users[user].y, 10, 10);
      ctx.font = "10px Arial";
      ctx.fillText(users[user].name, users[user].x, users[user].y - 5);
    }
  }
}

class ChatClient {
  constructor(id, users) {
    this.users = users;
    this.id = id;
  }

  start(option) {
    const { onReceive, onReceiveAlive } = option;
    const events = new EventSource("/api/listen");
    this.status = "";
    events.addEventListener("open", () => {
      this.status = "CONNECTED";
      console.log("connected");
      setInterval(() => {
        if (this.status === "CONNECTED") {
          this.sendAlive();
        }
      }, 2000);
    });
    events.addEventListener("error", () => {
      switch (events.readyState) {
        case EventSource.OPEN:
          this.status = "CONNECTED";
          break;
        case EventSource.CONNECTING:
          this.status = "CONNECTING";
          break;
        case EventSource.CLOSED:
          this.status = "DISCONNECTED";
          break;
      }
    });

    events.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "message") {
        onReceive(msg);
      }
      if (msg.type === "alive") {
        onReceiveAlive(msg);
      }
    });
  }

  async sendMessage(message) {
    if (message.length === 0) {
      return;
    }
    await fetch("/api/send", {
      method: "POST",
      body: JSON.stringify({
        user: user,
        type: "message",
        body: message,
      }),
    });
  }
  async sendAlive() {
    await fetch("/api/send", {
      method: "POST",
      body: JSON.stringify({ user: user, type: "alive", body: "" }),
    });
  }
}

const canvas = document.getElementById("canv");
const ctx = canvas.getContext("2d");
let globalMessages = [];
const userMessages = {};
const users = {};
const user = {
  id: Date.now(),
  name: "taro",
  x: Math.random() * 300,
  y: Math.random() * 200,
};
users[user.id] = user;
const field = new Field(canvas, users, user.id);
const client = new ChatClient(user.id, users);
client.start({
  onReceive(msg) {
    // 自IDのメッセージは無視
    if (msg.user.id === user.id) {
      return;
    }
    // ユーザ追加
    if (!users[msg.user.id]) {
      users[msg.user.id] = msg.user;
    }
    if (!userMessages[msg.user.id]) {
      userMessages[msg.user.id] = [];
    }
    userMessages[msg.user.id].push(msg);
  },
  onReceiveAlive(msg) {
    // 自IDのメッセージは無視
    if (msg.user.id === user.id) {
      return;
    }
    // ユーザ追加
    if (!users[msg.user.id]) {
      users[msg.user.id] = msg.user;
    }

    // ユーザ削除
    Object.keys(users).forEach((id) => {
      if (users[id].ts < Date.now() - 10 * 1000) {
        delete users[id];
      }
    });
  },
});
setInterval(() => {
  field.render();
}, 100);

const send = document.getElementById("send");
send.addEventListener("click", (ev) => {
  const msg = document.getElementById("msg");
  ev.preventDefault();
  client.sendMessage(msg.value);
  msg.value = "";
});