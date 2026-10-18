import type { Preview } from '@storybook/react-vite';
import '../src/index.css';
import '../src/ui/ui.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
  },
};

export default preview;
