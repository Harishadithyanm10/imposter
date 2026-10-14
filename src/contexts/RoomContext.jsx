import { createContext, useContext } from 'react';

export const RoomContext = createContext(null);
export const useRoom = () => useContext(RoomContext);
