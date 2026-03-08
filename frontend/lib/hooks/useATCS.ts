"use client";

import { useState, useCallback, useRef } from "react";

export interface ATCSState {
    intersection_telemetry: Record<string, any>;
    signal_plan: any;
}

export function useATCS() {
    const [data, setData] = useState<ATCSState | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startProcessing = useCallback(async (files: Record<string, File>) => {
        setIsProcessing(true);
        setError(null);

        const formData = new FormData();
        formData.append("north", files.north);
        formData.append("south", files.south);
        formData.append("east", files.east);
        formData.append("west", files.west);

        try {
            // Step 1: Initial Upload & Process
            const response = await fetch("http://localhost:8000/api/atcs/upload-intersection", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Backend connection failed");

            const result = await response.json();
            setData(result);

            // Step 2: Start Polling Loop (Every 2 seconds)
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            pollIntervalRef.current = setInterval(async () => {
                try {
                    const pollRes = await fetch("http://localhost:8000/api/atcs/upload-intersection", {
                        method: "POST",
                        body: formData,
                    });
                    const pollData = await pollRes.json();
                    setData(pollData);
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 2000);

        } catch (err: any) {
            setError(err.message);
            setIsProcessing(false);
        }
    }, []);

    const stopProcessing = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsProcessing(false);
    };

    return { data, isProcessing, error, startProcessing, stopProcessing };
}
