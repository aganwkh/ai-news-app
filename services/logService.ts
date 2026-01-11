
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: any;
}

class LogService {
  private logs: LogEntry[] = [];
  private maxLogs = 500;

  private add(level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details: details ? this.safeSerialize(details) : undefined
    };
    
    this.logs.unshift(entry); // Prepend new logs
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    
    // Also output to console for developer tools
    const consoleMethod = level.toLowerCase() as 'log' | 'warn' | 'error';
    console[consoleMethod](`[${level}] ${message}`, details || '');
  }

  private safeSerialize(obj: any): any {
    // Handle Error objects specifically to preserve properties
    if (obj instanceof Error) {
      return {
        name: obj.name,
        message: obj.message,
        stack: obj.stack,
        // @ts-ignore
        cause: obj.cause ? this.safeSerialize(obj.cause) : undefined,
        ...(obj as any) // Include any custom properties
      };
    }

    try {
      const str = JSON.stringify(obj, (key, value) => {
        if (key === 'apiKey') return '***'; // Redact sensitive info
        if (value instanceof Error) {
            return { name: value.name, message: value.message, stack: value.stack };
        }
        return value;
      });
      // Parse back to object so it can be viewed nicely in UI (or exported as JSON)
      return JSON.parse(str || '{}');
    } catch (e) {
      return `[Serialization Error: ${String(e)}]`;
    }
  }

  info(message: string, details?: any) { this.add('INFO', message, details); }
  warn(message: string, details?: any) { this.add('WARN', message, details); }
  error(message: string, details?: any) { this.add('ERROR', message, details); }

  getLogs() { return this.logs; }
  
  clear() { this.logs = []; }

  exportLogs() {
    const text = this.logs.map(l => {
      let detailStr = '';
      if (l.details) {
        try {
           const d = typeof l.details === 'string' ? l.details : JSON.stringify(l.details, null, 2);
           detailStr = `\nDetails: ${d}`;
        } catch (e) {
           detailStr = `\nDetails: [Complex Object]`;
        }
      }
      return `[${l.timestamp}] [${l.level}] ${l.message}${detailStr}`;
    }).join('\n' + '-'.repeat(40) + '\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const logger = new LogService();
