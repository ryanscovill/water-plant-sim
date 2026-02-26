import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom';
}

export function Tooltip({ text, children, placement = 'bottom' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLElement | null>(null);

  const show = () => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const top = placement === 'bottom'
      ? r.bottom + window.scrollY + 6
      : r.top + window.scrollY - 6;
    setCoords({ top, left: r.left + r.width / 2 + window.scrollX });
    setVisible(true);
  };

  const hide = () => setVisible(false);

  // Clone child to attach ref + events without extra DOM wrapper
  const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }>;
  const cloned = {
    ...child,
    props: {
      ...child.props,
      ref: (el: HTMLElement | null) => {
        anchorRef.current = el;
        // Forward existing ref if any
        const existingRef = (child as { ref?: React.Ref<HTMLElement> }).ref;
        if (typeof existingRef === 'function') existingRef(el);
      },
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        show();
        child.props.onMouseEnter?.(e);
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        hide();
        child.props.onMouseLeave?.(e);
      },
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        show();
        child.props.onFocus?.(e);
      },
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        hide();
        child.props.onBlur?.(e);
      },
    },
  } as React.ReactElement;

  useEffect(() => () => setVisible(false), []);

  return (
    <>
      {cloned}
      {visible && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            transform: placement === 'bottom'
              ? 'translateX(-50%)'
              : 'translateX(-50%) translateY(-100%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <div className="bg-gray-800 border border-gray-600 text-gray-200 text-xs font-mono px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap">
            {text}
            {/* Arrow */}
            <span
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                ...(placement === 'bottom'
                  ? { top: -4, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '4px solid #4b5563' }
                  : { bottom: -4, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #4b5563' }),
                width: 0,
                height: 0,
                display: 'block',
              }}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
