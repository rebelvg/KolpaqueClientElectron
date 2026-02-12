import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    nightMode: boolean;
    klpq: string;
    outline: string;
    client: {
      color: string;
      bg: string;
    };
    clientSecondary: {
      color: string;
      bg: string;
    };
    channel: {
      color: string;
      bg: string;
    };
    channelSelected: {
      color: string;
      bg: string;
    };
    tab: {
      color: string;
      bg: string;
    };
    tabSelected: {
      color: string;
      bg: string;
    };
    input: {
      color: string;
      bg: string;
    };
  }
}
