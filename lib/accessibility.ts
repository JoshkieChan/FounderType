// Accessibility Compliance for FounderType
// WCAG 2.1 AA compliance implementation

export interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableLargeText: boolean;
  enableReducedMotion: boolean;
  enableKeyboardNavigation: boolean;
  colorBlindnessType: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: AccessibilityConfig;
  private observers: MutationObserver[] = [];

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  constructor() {
    this.config = {
      enableScreenReader: false,
      enableHighContrast: false,
      enableLargeText: false,
      enableReducedMotion: false,
      enableKeyboardNavigation: true,
      colorBlindnessType: 'none',
    };

    this.initializeAccessibility();
  }

  // Initialize accessibility features
  private initializeAccessibility(): void {
    if (typeof window !== 'undefined') {
      this.detectSystemPreferences();
      this.setupKeyboardNavigation();
      this.setupScreenReader();
      this.setupFocusManagement();
    }
  }

  // Detect system accessibility preferences
  private detectSystemPreferences(): void {
    if (window.matchMedia) {
      // Detect reduced motion preference
      const reducedMotionQuery = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );
      this.config.enableReducedMotion = reducedMotionQuery.matches;

      reducedMotionQuery.addEventListener('change', (e) => {
        this.config.enableReducedMotion = e.matches;
        this.applyReducedMotion();
      });

      // Detect high contrast preference
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      this.config.enableHighContrast = highContrastQuery.matches;

      highContrastQuery.addEventListener('change', (e) => {
        this.config.enableHighContrast = e.matches;
        this.applyHighContrast();
      });
    }
  }

  // Setup keyboard navigation
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
      // Skip to main content (Alt + M)
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        this.skipToMainContent();
      }

      // Focus trap for modals
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }

      // Escape key to close modals
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }

      // Arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
    });

    // Add focus indicators
    this.addFocusIndicators();
  }

  // Setup screen reader support
  private setupScreenReader(): void {
    // Add ARIA live regions
    this.createLiveRegions();

    // Announce dynamic content changes
    this.setupContentAnnouncements();

    // Add proper ARIA labels
    this.addARIALabels();
  }

  // Setup content announcements
  private setupContentAnnouncements(): void {
    // Monitor for dynamic content changes
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Announce new content
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (
                  element.tagName === 'DIV' ||
                  element.tagName === 'SECTION'
                ) {
                  const text = element.textContent?.trim();
                  if (text && text.length > 0) {
                    this.announce(`New content: ${text.substring(0, 100)}`);
                  }
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.observers.push(observer);
    }
  }

  // Setup focus management
  private setupFocusManagement(): void {
    // Manage focus for dynamic content
    this.manageFocusForDynamicContent();

    // Add skip links
    this.addSkipLinks();

    // Handle focus traps
    this.setupFocusTraps();
  }

  // Manage focus for dynamic content
  private manageFocusForDynamicContent(): void {
    // Monitor for route changes and manage focus
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        setTimeout(() => {
          const mainContent = document.querySelector(
            'main, [role="main"], .main-content'
          );
          if (mainContent) {
            (mainContent as HTMLElement).focus();
          }
        }, 100);
      };

      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args);
        setTimeout(() => {
          const mainContent = document.querySelector(
            'main, [role="main"], .main-content'
          );
          if (mainContent) {
            (mainContent as HTMLElement).focus();
          }
        }, 100);
      };
    }
  }

  // Add skip links
  private addSkipLinks(): void {
    // Check if skip links already exist
    if (document.querySelector('.skip-link')) {
      return;
    }

    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';

    // Style the skip link
    Object.assign(skipLink.style, {
      position: 'absolute',
      top: '-40px',
      left: '6px',
      background: '#000',
      color: '#fff',
      padding: '8px',
      textDecoration: 'none',
      borderRadius: '4px',
      zIndex: '9999',
      transition: 'top 0.3s',
    });

    // Show on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add target element if it doesn't exist
    if (!document.querySelector('#main-content')) {
      const mainContent =
        document.querySelector('main') || document.createElement('main');
      mainContent.id = 'main-content';
      if (!document.querySelector('main')) {
        document.body.insertBefore(mainContent, document.body.firstChild);
      }
    }
  }

  // Apply reduced motion
  private applyReducedMotion(): void {
    if (this.config.enableReducedMotion) {
      document.documentElement.style.setProperty(
        '--transition-duration',
        '0ms'
      );
      document.documentElement.style.setProperty('--animation-duration', '0ms');

      // Disable animations
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Apply high contrast
  private applyHighContrast(): void {
    if (this.config.enableHighContrast) {
      document.documentElement.classList.add('high-contrast');

      const style = document.createElement('style');
      style.textContent = `
        .high-contrast {
          --background: #000000 !important;
          --text: #ffffff !important;
          --primary: #ffff00 !important;
          --border: #ffffff !important;
        }
        
        .high-contrast * {
          background: transparent !important;
          color: inherit !important;
          border-color: var(--border) !important;
        }
        
        .high-contrast button,
        .high-contrast input,
        .high-pressure textarea,
        .high-contrast select {
          background: var(--background) !important;
          color: var(--text) !important;
          border: 2px solid var(--border) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Create ARIA live regions
  private createLiveRegions(): void {
    // Polite live region for announcements
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only live-region-polite';
    document.body.appendChild(politeRegion);

    // Assertive live region for important announcements
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only live-region-assertive';
    document.body.appendChild(assertiveRegion);
  }

  // Announce content to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = document.querySelector(`.live-region-${priority}`);
    if (region) {
      region.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  // Add ARIA labels to interactive elements
  private addARIALabels(): void {
    // Add labels to buttons without text
    document.querySelectorAll('button:not([aria-label])').forEach((button) => {
      if (!button.textContent.trim()) {
        const icon = button.querySelector('svg, i');
        if (icon) {
          button.setAttribute('aria-label', this.getIconLabel(icon));
        }
      }
    });

    // Add labels to form inputs
    document.querySelectorAll('input, textarea, select').forEach((input) => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', this.getInputLabel(input));
      }
    });

    // Add descriptions to complex elements
    this.addAriaDescriptions();
  }

  // Get appropriate label for icon
  private getIconLabel(icon: Element): string {
    const iconClasses = icon.className;

    if (iconClasses.includes('close')) return 'Close';
    if (iconClasses.includes('menu')) return 'Menu';
    if (iconClasses.includes('search')) return 'Search';
    if (iconClasses.includes('settings')) return 'Settings';
    if (iconClasses.includes('user')) return 'User profile';
    if (iconClasses.includes('home')) return 'Home';
    if (iconClasses.includes('back')) return 'Go back';
    if (iconClasses.includes('forward')) return 'Go forward';

    return 'Interactive element';
  }

  // Get appropriate label for input
  private getInputLabel(input: Element): string {
    const type = input.getAttribute('type');
    const placeholder = input.getAttribute('placeholder');

    if (placeholder) return placeholder;
    if (type === 'email') return 'Email address';
    if (type === 'password') return 'Password';
    if (type === 'search') return 'Search';
    if (type === 'tel') return 'Phone number';

    return 'Text input';
  }

  // Add ARIA descriptions
  private addAriaDescriptions(): void {
    // Add help text for complex inputs
    document.querySelectorAll('input[required]').forEach((input) => {
      const helpText = document.createElement('div');
      helpText.textContent = 'This field is required';
      helpText.className = 'sr-only';
      helpText.id = `${input.id}-help`;

      input.setAttribute('aria-describedby', `${input.id}-help`);
      input.parentNode?.insertBefore(helpText, input.nextSibling);
    });
  }

  // Add focus indicators
  private addFocusIndicators(): void {
    const style = document.createElement('style');
    style.textContent = `
      *:focus {
        outline: 2px solid #0066cc !important;
        outline-offset: 2px !important;
      }
      
      *:focus:not(:focus-visible) {
        outline: 2px solid #0066cc !important;
        outline-offset: 2px !important;
      }
      
      *:focus-visible {
        outline: 2px solid #0066cc !important;
        outline-offset: 2px !important;
      }
      
      button:focus,
      input:focus,
      textarea:focus,
      select:focus {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Skip to main content
  private skipToMainContent(): void {
    const mainContent = document.querySelector(
      'main, [role="main"], .main-content'
    ) as HTMLElement | null;
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      mainContent.removeAttribute('tabindex');

      this.announce('Skipped to main content');
    }
  }

  // Handle tab navigation
  private handleTabNavigation(e: KeyboardEvent): void {
    // Check for focus traps
    const modal = document.querySelector('[role="dialog"]:not([hidden])');
    if (modal) {
      this.trapFocusInModal(modal, e);
    }
  }

  // Trap focus within modal
  private trapFocusInModal(modal: Element, e: KeyboardEvent): void {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  // Handle escape key
  private handleEscapeKey(): void {
    // Close modals
    const modal = document.querySelector('[role="dialog"]:not([hidden])');
    if (modal) {
      const closeButton = modal.querySelector(
        'button[aria-label="Close"], .close-button'
      ) as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  }

  // Handle arrow navigation
  private handleArrowNavigation(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;

    // Handle menu navigation
    if (target.getAttribute('role') === 'menuitem') {
      this.handleMenuNavigation(e);
    }

    // Handle list navigation
    if (target.getAttribute('role') === 'option') {
      this.handleListNavigation(e);
    }
  }

  // Handle menu navigation
  private handleMenuNavigation(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    const menu = target?.parentElement;
    if (!menu) return;

    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    const currentIndex = items.indexOf(target as Element);

    let nextIndex;
    if (e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
      nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    } else {
      return;
    }

    e.preventDefault();
    (items[nextIndex] as HTMLElement).focus();
  }

  // Handle list navigation
  private handleListNavigation(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    const list = target?.parentElement;
    if (!list) return;

    const items = Array.from(list.querySelectorAll('[role="option"]'));
    const currentIndex = items.indexOf(target as Element);

    let nextIndex;
    if (e.key === 'ArrowDown') {
      nextIndex = Math.min(currentIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      nextIndex = Math.max(currentIndex - 1, 0);
    } else {
      return;
    }

    e.preventDefault();
    (items[nextIndex] as HTMLElement).focus();
  }

  // Setup focus traps
  private setupFocusTraps(): void {
    // Monitor for modal dialogs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.getAttribute('role') === 'dialog') {
              this.setupModalFocusTrap(element);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  // Setup modal focus trap
  private setupModalFocusTrap(modal: Element): void {
    // Focus first focusable element when modal opens
    setTimeout(() => {
      const firstFocusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);
  }

  // Update configuration
  updateConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.enableHighContrast !== undefined) {
      this.applyHighContrast();
    }

    if (config.enableReducedMotion !== undefined) {
      this.applyReducedMotion();
    }
  }

  // Get current configuration
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  // Run accessibility audit
  runAccessibilityAudit(): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for missing alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
      recommendations.push('Add descriptive alt text to all images');
    }

    // Check for missing labels
    const inputsWithoutLabels = document.querySelectorAll(
      'input:not([aria-label]):not([id])'
    );
    if (inputsWithoutLabels.length > 0) {
      issues.push(`${inputsWithoutLabels.length} inputs missing labels`);
      recommendations.push('Add labels to all form inputs');
    }

    // Check for proper heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    let headingIssues = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.substring(1));
      if (level > lastLevel + 1) {
        headingIssues++;
      }
      lastLevel = level;
    });

    if (headingIssues > 0) {
      issues.push(`${headingIssues} heading level skips detected`);
      recommendations.push('Use proper heading hierarchy (h1 → h2 → h3)');
    }

    // Calculate score
    const totalChecks = 3;
    const passedChecks = totalChecks - issues.length;
    const score = Math.round((passedChecks / totalChecks) * 100);

    return {
      score,
      issues,
      recommendations,
    };
  }

  // Cleanup
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}
