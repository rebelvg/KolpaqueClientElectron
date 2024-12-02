import React from 'react';
import { storeContext } from '../stores/storeContext';

export const useStores = () => React.useContext(storeContext);
