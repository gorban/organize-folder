export interface BannerOptions {
  title?: string;
  className?: string;
}

export class Banner {
  private element: HTMLElement;
  private title: string;

  constructor(options: BannerOptions = {}) {
    this.title = options.title || 'Organize Folder';
    this.element = this.createElement(options.className);
  }

  private createElement(className?: string): HTMLElement {
    const banner = document.createElement('header');
    banner.className = `banner ${className || ''}`.trim();
    banner.setAttribute('data-testid', 'app-banner');
    
    const titleElement = document.createElement('h1');
    titleElement.className = 'banner-title';
    titleElement.textContent = this.title;
    titleElement.setAttribute('data-testid', 'banner-title');
    
    banner.appendChild(titleElement);
    
    return banner;
  }

  public render(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  public setTitle(title: string): void {
    this.title = title;
    const titleElement = this.element.querySelector('.banner-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  public getTitle(): string {
    return this.title;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}