import { Subject, Subscription } from 'rxjs';
import { Bot } from '../Bot';
import { Client } from '../Client';
import {
  BaseEvent,
  ClientClosedEvent,
  ClientConnectedEvent,
  ClientErrorEvent
} from '../events';
import { parseEvents } from '../parser';

export class EventEmitter {
  private readonly eventSubject: Subject<BaseEvent>;

  constructor(bot: Bot, client: Client) {
    this.eventSubject = new Subject();
    this.attachListeners(bot, client);
  }

  public emit(event: BaseEvent): void {
    this.eventSubject.next(event);
  }

  public onEvent(handler: (event: BaseEvent) => void): Subscription {
    return this.eventSubject.subscribe(handler);
  }

  private attachListeners(bot: Bot, client: Client): void {
    client.onStart(() => this.emit(new ClientConnectedEvent()));
    client.onClose(() => this.emit(new ClientClosedEvent()));
    client.onError(error => this.emit(new ClientErrorEvent({ error })));
    client.onMessage(message => {
      const oldRoomId = bot.roomId;

      for (const event of parseEvents(bot, message)) {
        if (bot.roomId !== oldRoomId) {
          break;
        }

        this.emit(event);
      }
    });
  }
}
