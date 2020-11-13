import React, { KeyboardEvent, ChangeEvent, Component } from 'react'
import MessageInterface from './MessageInterface'
import MessagingService from './MessagingService'

class App extends Component<
  {},
  {
    service?: MessagingService
    id?: string
    messageHistory: string[]
    connectedTo?: string
    connectionTarget: string
  }
> {
  constructor(props: {}) {
    super(props)
    this.state = {
      connectionTarget: '',
      messageHistory: [],
    }
  }

  async componentDidMount() {
    const service = new MessagingService({
      onMessage: this.receiveMessage,
      onConnected: (connectedTo: string) => this.setState({ connectedTo }),
      onOpen: (id: string) => this.setState({ id }),
    })
    this.setState({ service })
  }

  setConnectionTarget = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ connectionTarget: e.target.value })
  }

  startConnection = async () => {
    if (!this.state.service) {
      throw new Error('Service not available yet')
    }
    this.state.service.connect(this.state.connectionTarget)
  }

  sendMessage = async (message: string) => {
    if (!this.state.service) {
      throw new Error('Service not available yet')
    }
    this.state.service.send(message)
    this.setState({
      messageHistory: [...this.state.messageHistory, message],
    })
  }

  receiveMessage = (message: MessageEvent) => {
    this.setState({
      messageHistory: [...this.state.messageHistory, message.data],
    })
  }

  render() {
    const { id, connectedTo, messageHistory, service } = this.state
    if (!service || !id) {
      return (
        <div className="App">
          Contacting signal server...
        </div>
      )
    }

    if (connectedTo) {
      return (
        <div className="App">
          {id && <span>You are {id}</span>}
          <br />
          <span>Connected to {connectedTo}</span>
          <MessageInterface
            onSend={this.sendMessage}
            messageHistory={messageHistory}
          />
        </div>
      )
    }
      return (
        <div className="App">
          {id && <span>You are {id}</span>}
          <div>
            <label> Connect to </label>
            <input
              onChange={this.setConnectionTarget}
              onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  this.startConnection()
                }
              }}
            />
            <button onClick={this.startConnection}>Connect</button>
          </div>
        </div>
      )
  }
}

export default App
