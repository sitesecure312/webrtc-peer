import React, { KeyboardEvent, ChangeEvent, Component } from 'react'

class MessageInterface extends Component<
  {
    onSend: (message: string) => void
    messageHistory: string[]
  },
  {
    message: string
  }
> {
  constructor(props: {
    onSend: (message: string) => void
    messageHistory: string[]
  }) {
    super(props)

    this.state = {
      message: '',
    }
  }

  setMessage = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ message: e.target.value })
  }

  sendMessage = () => {
    if(this.state.message !== '') {
      this.props.onSend(this.state.message)
      this.setState({ message: '' })
    }
  }

  render() {
    const { messageHistory } = this.props
    const { message } = this.state
    return (
      <div>
        <ul>
          {messageHistory.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>

        <div>
          <input
            value={message}
            onChange={this.setMessage}
            onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                this.sendMessage()
              }
            }}
          />
          <button onClick={this.sendMessage}>Send</button>
        </div>
      </div>
    )
  }
}

export default MessageInterface
