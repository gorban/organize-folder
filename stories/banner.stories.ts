import { Meta, StoryObj } from '@storybook/html';
import { Banner } from '../src/renderer/components/banner';
import '../src/renderer/styles/main.css';

interface BannerArgs {
  title: string;
  className: string;
}

const meta: Meta<BannerArgs> = {
  title: 'Components/Banner',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'The title text displayed in the banner',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the banner',
    },
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.minHeight = '100px';
    
    const banner = new Banner({
      title: args.title,
      className: args.className,
    });
    
    banner.render(container);
    
    return container;
  },
};

export default meta;
type Story = StoryObj<BannerArgs>;

export const Default: Story = {
  args: {
    title: 'Organize Folder',
    className: '',
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Custom Title',
    className: '',
  },
};

export const WithCustomClass: Story = {
  args: {
    title: 'Organize Folder',
    className: 'custom-banner',
  },
};