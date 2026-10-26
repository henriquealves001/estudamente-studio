"use client";
import { useSyncExternalStore } from "react";
import App from "../src/App";
const subscribe=()=>()=>{};
export default function Studio(){const ready=useSyncExternalStore(subscribe,()=>true,()=>false); return ready ? <App/> : <div className="empty">Abrindo seu espaço de estudo…</div>; }
