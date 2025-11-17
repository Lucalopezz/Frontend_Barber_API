import { createContext } from "react";

import type { UserContextType } from "./UserProvider";

export const Context = createContext<UserContextType | undefined>(undefined);
