type BinaryType = 'blob' | 'arraybuffer'

const CONNECTING = 0 as const
const OPEN = 1 as const
const CLOSING = 2 as const
const CLOSED = 3 as const

// const WEBSOCKET_EVENTS = ['close', 'error', 'message', 'open']
type WEBSOCKET_EVENTS = 'close' | 'error' | 'message' | 'open'
// const nextWebSocketId = 0

export type WeappWebSocketTask = WechatMiniprogram.SocketTask & {
  readyState: number
  CLOSED: number
  CLOSING: number
  OPEN: number
}

export class WeappWebSocket
  implements
    Omit<
      WebSocket,
      | 'onclose'
      | 'onerror'
      | 'onmessage'
      | 'onopen'
      | 'dispatchEvent'
      | 'addEventListener'
      | 'removeEventListener'
    >
{
  static CONNECTING: number = CONNECTING
  static OPEN: number = OPEN
  static CLOSING: number = CLOSING
  static CLOSED: number = CLOSED
  private task: WeappWebSocketTask
  private eventMap = {
    close: [],
    error: [],
    message: [],
    open: []
  } as {
    close: Function[]
    error: Function[]
    message: Function[]
    open: Function[]
  }

  CONNECTING = CONNECTING
  OPEN = OPEN
  CLOSING = CLOSING
  CLOSED = CLOSED
  // 微信小程序只有这一种类型
  binaryType: BinaryType = 'arraybuffer'
  bufferedAmount: number = 0
  extensions: string = ''
  constructor(
    url: string | URL,
    protocols?: string | string[],
    options?: Partial<
      Omit<WechatMiniprogram.ConnectSocketOption, 'url' | 'protocols'>
    >,
    connectSocket = wx.connectSocket
  ) {
    this.url = typeof url === 'string' ? url : url.toString()

    const params: WechatMiniprogram.ConnectSocketOption = {
      url: this.url,
      protocols: typeof protocols === 'string' ? [protocols] : protocols
    }
    if (typeof options === 'object') {
      Object.keys(options).forEach((k) => {
        // @ts-ignore
        params[k] = options[k]
      })
    }
    this.task = connectSocket(params) as WeappWebSocketTask

    this.task.onOpen((result: WechatMiniprogram.OnOpenListenerResult) => {
      this.eventMap.open.forEach((fn) => {
        fn.call(this.task, result)
      })
    })

    this.task.onError((result: WechatMiniprogram.GeneralCallbackResult) => {
      this.eventMap.error.forEach((fn) => {
        fn.call(this.task, result)
      })
    })

    this.task.onMessage(
      (result: WechatMiniprogram.SocketTaskOnMessageListenerResult) => {
        this.eventMap.message.forEach((fn) => {
          fn.call(this.task, result)
        })
      }
    )

    this.task.onClose(
      (result: WechatMiniprogram.SocketTaskOnCloseListenerResult) => {
        this.eventMap.close.forEach((fn) => {
          fn.call(this.task, result)
        })
      }
    )
  }

  // 这个协议应该由socket open 的时候获取到， 所以是服务端返回的
  protocol: string = ''
  // #region on event
  private oncloseIndex: number = -1
  private onerrorIndex: number = -1
  private onmessageIndex: number = -1
  private onopenIndex: number = -1
  get onclose(): Function | null {
    return this.eventMap.close[this.oncloseIndex] || null
  }

  set onclose(fn: Function | null) {
    if (fn) {
      if (typeof fn === 'function') {
        this.eventMap.close.push(fn)
        this.oncloseIndex = this.eventMap.close.length - 1
      }
      // do nothing
    } else {
      this.eventMap.close.splice(this.oncloseIndex, 1)
      this.oncloseIndex = -1
    }
  }

  get onerror(): Function | null {
    return this.eventMap.error[this.onerrorIndex] || null
  }

  set onerror(fn: Function | null) {
    if (fn) {
      if (typeof fn === 'function') {
        this.eventMap.error.push(fn)
        this.onerrorIndex = this.eventMap.error.length - 1
      }
      // do nothing
    } else {
      this.eventMap.error.splice(this.onerrorIndex, 1)
      this.onerrorIndex = -1
    }
  }

  get onmessage(): Function | null {
    return this.eventMap.message[this.onmessageIndex] || null
  }

  set onmessage(fn: Function | null) {
    if (fn) {
      if (typeof fn === 'function') {
        this.eventMap.message.push(fn)
        this.onmessageIndex = this.eventMap.message.length - 1
      }
      // do nothing
    } else {
      this.eventMap.message.splice(this.onmessageIndex, 1)
      this.onmessageIndex = -1
    }
  }

  get onopen(): Function | null {
    return this.eventMap.open[this.onopenIndex] || null
  }

  set onopen(fn: Function | null) {
    if (fn) {
      if (typeof fn === 'function') {
        this.eventMap.open.push(fn)
        this.onopenIndex = this.eventMap.open.length - 1
      }
      // do nothing
    } else {
      this.eventMap.open.splice(this.onopenIndex, 1)
      this.onopenIndex = -1
    }
  }

  // #endregion

  get readyState() {
    return this.task.readyState
  }

  url: string

  close(code?: number | undefined, reason?: string | undefined): void {
    return this.task.close({
      code,
      reason
    })
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    return this.task.send({
      data: data as string | ArrayBuffer
    })
  }

  addEventListener(
    type: WEBSOCKET_EVENTS,
    listener: Function
    // options?: unknown
  ): void {
    if (this.eventMap[type]) {
      this.eventMap[type].push(listener)
    }
  }

  removeEventListener(
    type: WEBSOCKET_EVENTS,
    listener: Function
    // options?: unknown
  ): void {
    if (this.eventMap[type]) {
      const idx = this.eventMap[type].indexOf(listener)
      if (idx > -1) {
        this.eventMap[type].splice(idx, 1)
      }
    }
  }

  dispatchEvent(event: WEBSOCKET_EVENTS): boolean {
    this.eventMap[event].forEach((fn) => {
      fn.call(this.task)
    })
    return true
    //
    // throw new Error('Method not implemented.')
  }
}
