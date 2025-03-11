// services/EventService.ts
import { EventEmitter } from 'events';

/**
 * Serviço central para gerenciamento de eventos do sistema
 * Permite comunicação desacoplada entre diferentes partes da aplicação
 */
class EventService {
    private emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
        // Aumentar o limite de listeners para evitar warnings em sistemas grandes
        this.emitter.setMaxListeners(30);
    }

    /**
     * Emite um evento com os dados fornecidos
     * @param eventName Nome do evento
     * @param data Dados associados ao evento
     */
    emit(eventName: string, data: any): void {
        console.log(`[EVENT] Emitindo evento: ${eventName}`);
        this.emitter.emit(eventName, data);
    }

    /**
     * Registra um listener para um evento específico
     * @param eventName Nome do evento para escutar
     * @param listener Função callback que será executada quando o evento ocorrer
     */
    on(eventName: string, listener: (...args: any[]) => void): void {
        console.log(`[EVENT] Registrando listener para: ${eventName}`);
        this.emitter.on(eventName, listener);
    }

    /**
     * Remove um listener específico de um evento
     * @param eventName Nome do evento
     * @param listener Função listener a ser removida
     */
    off(eventName: string, listener: (...args: any[]) => void): void {
        this.emitter.off(eventName, listener);
    }

    /**
     * Registra um listener que será executado apenas uma vez
     * @param eventName Nome do evento
     * @param listener Função callback que será executada quando o evento ocorrer
     */
    once(eventName: string, listener: (...args: any[]) => void): void {
        this.emitter.once(eventName, listener);
    }
}

// Exporta uma única instância para ser usada por toda a aplicação
const eventService = new EventService();
export default eventService;
