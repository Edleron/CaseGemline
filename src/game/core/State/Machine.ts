import { assign, setup } from 'xstate';

//#region CONSTANTS
const m_Types = {
    SYMBOL_DRAG_START: 'symboldragstart',
    SYMBOL_DRAG_END: 'symboldragend',
    SYMBOL_DRAG_MOVE: 'symboldragmove',
    SYMBOL_HOVER_START: 'symbolhoverstart',
    SYMBOL_HOVER_END: 'symbolhoverend',
    PROCESS_MATCHES: 'processmatches',
    MATCHES_COMPLETED: 'matchescompleted',
} as const;

const m_Actions = {
    emit_event: 'emit_event',
    drag_start: 'drag-start',
    drag_end: 'drag_end',
    drag_move: 'drag_move',
    hover_start: 'hover_start',
    hover_end: 'hover_end',
    store_matches: 'store_matches',
    clear_matches: 'clear_matches',
} as const;

const m_Targets = {
    idle: 'idle',
    dragging: 'dragging',
    hovering: 'hovering',
    matching: 'matching',
    dropping: 'dropping'
} as const;
//#endregion

//#region INTERFACES
interface IContext {
    draggedSymbol: any | null;
    hoveredSymbol: any | null;
    dropTarget: { row: number; col: number } | null;
    isValidDrop: boolean;
    pendingMatches: any | null;
}
//#endregion

//#region TYPE ALIASES
type TEvents =
    | { type: typeof m_Types.SYMBOL_DRAG_START; symbol: any }
    | { type: typeof m_Types.SYMBOL_DRAG_END; symbol: any; position: { x: number; y: number } }
    | { type: typeof m_Types.SYMBOL_DRAG_MOVE; position: { x: number; y: number } }
    | { type: typeof m_Types.SYMBOL_HOVER_START; symbol: any }
    | { type: typeof m_Types.SYMBOL_HOVER_END; symbol: any }
    | { type: typeof m_Types.PROCESS_MATCHES; matches: any }
    | { type: typeof m_Types.MATCHES_COMPLETED };
//#endregion

export const UIStateMachine = setup({
    types: {
        context: {} as IContext,
        events: {} as TEvents,
    },
    actors: {

    },
    actions: {
        [m_Actions.drag_start]: assign({
            draggedSymbol: ({ event }) => {
                return event.type === m_Types.SYMBOL_DRAG_START ? event.symbol : null;
            },
        }),
        [m_Actions.drag_end]: assign({
            draggedSymbol: () => {
                return null;
            },
            dropTarget: () => null,
            isValidDrop: () => false,
        }),
        [m_Actions.drag_move]: assign({
            dropTarget: ({ event }) => {
                return event.type === m_Types.SYMBOL_DRAG_MOVE ? { row: 0, col: 0 } : null;
            }
        }),
        [m_Actions.hover_start]: assign({
            hoveredSymbol: ({ event }) => {
                return event.type === m_Types.SYMBOL_HOVER_START ? event.symbol : null;
            },
        }),
        [m_Actions.hover_end]: assign({
            hoveredSymbol: () => {
                return null;
            },
        }),
        [m_Actions.store_matches]: assign({
            pendingMatches: ({ event }) => {
                return event.type === m_Types.PROCESS_MATCHES ? event.matches : null;
            },
        }),
        [m_Actions.clear_matches]: assign({
            pendingMatches: () => null,
        }),
        logIdleEntry: () => {
            // console.log('[State] Entered idle');
        },
        logDraggingEntry: () => {
            // console.log('[State] Entered dragging');
        },
        logHoveringEntry: () => {
            // console.log('[State] Entered hovering');
        },
        logMatchingEntry: () => {
            // console.log('[State] Entered matching');
        },
        logDroppingEntry: () => {
            // console.log('[State] Entered dropping');
        },
    },
}).createMachine({
    context: {
        draggedSymbol: null,
        hoveredSymbol: null,
        dropTarget: null,
        isValidDrop: false,
        pendingMatches: null,
    },
    id: 'gameStateMachine',
    initial: m_Targets.idle,
    states: {
        [m_Targets.idle]: {
            entry: ['logIdleEntry'],
            on: {
                [m_Types.SYMBOL_DRAG_START]: {
                    target: m_Targets.dragging,
                    actions: [m_Actions.drag_start]
                },
                [m_Types.SYMBOL_HOVER_START]: {
                    target: m_Targets.hovering,
                    actions: [m_Actions.hover_start]
                },
                [m_Types.PROCESS_MATCHES]: {
                    target: m_Targets.matching,
                    actions: [m_Actions.store_matches]
                }
            }
        },
        [m_Targets.dragging]: {
            entry: ['logDraggingEntry'],
            on: {
                [m_Types.SYMBOL_DRAG_MOVE]: {
                    actions: [m_Actions.drag_move]
                },
                [m_Types.SYMBOL_DRAG_END]: {
                    target: m_Targets.idle,
                    actions: [m_Actions.drag_end]
                }
            }
        },
        [m_Targets.hovering]: {
            entry: ['logHoveringEntry'],
            on: {
                [m_Types.SYMBOL_HOVER_END]: {
                    target: m_Targets.idle,
                    actions: [m_Actions.hover_end]
                },
                [m_Types.SYMBOL_DRAG_START]: {
                    target: m_Targets.dragging,
                    actions: [m_Actions.drag_start]
                }
            }
        },
        [m_Targets.matching]: {
            entry: ['logMatchingEntry'],
            on: {
                [m_Types.MATCHES_COMPLETED]: {
                    target: m_Targets.idle,
                    actions: [m_Actions.clear_matches]
                }
            }
        },
        [m_Targets.dropping]: {
            entry: ['logDroppingEntry'],
        }
    },
    on: {
        
    },
});
