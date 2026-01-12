'use client';

interface TerminalProps {
  title?: string;
  logs: string[];
  maxLines?: number;
}

export function Terminal({ title = 'System Logs', logs, maxLines = 5 }: TerminalProps) {
  const displayLogs = logs.slice(0, maxLines);

  return (
    <div className="border-4 border-black bg-black p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col">
      <h5 className="text-white font-mono text-[10px] mb-3 uppercase border-b border-zinc-800 pb-1">
        {title}
      </h5>
      <div className="flex-1 overflow-hidden space-y-2">
        {displayLogs.length === 0 ? (
          <div className="font-mono text-[9px] text-zinc-500">
            {'> Aguardando eventos...'}
          </div>
        ) : (
          displayLogs.map((log, i) => (
            <div 
              key={i} 
              className={`font-mono text-[9px] ${i === 0 ? 'text-green-400' : 'text-zinc-500'}`}
            >
              {`> ${log}`}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

