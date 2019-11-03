const logs: string[] = [];

export function addLogs(...log: any[]) {
  const logLine = log.map(logItem => JSON.stringify(logItem)).join(' ');

  console.log(logLine);

  logs.push(logLine);
}
