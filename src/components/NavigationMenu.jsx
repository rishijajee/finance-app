import { useState } from 'react';
import '../App.css';

function NavigationMenu({ onNavigate, currentView }) {
  const [openMenu, setOpenMenu] = useState(null);

  const handleMenuClick = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = (view) => {
    onNavigate(view);
    setOpenMenu(null);
  };

  return (
    <nav className="navigation-menu">
      <ul className="menu-list">
        <li className="menu-item">
          <button
            className={`menu-button ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => handleMenuItemClick('home')}
          >
            Home
          </button>
        </li>

        <li className="menu-item menu-item-dropdown">
          <button
            className={`menu-button ${openMenu === 'options' ? 'menu-open' : ''}`}
            onClick={() => handleMenuClick('options')}
          >
            Options
            <span className="dropdown-arrow">{openMenu === 'options' ? '▼' : '▶'}</span>
          </button>

          {openMenu === 'options' && (
            <ul className="submenu">
              <li className="submenu-item">
                <button
                  className={`submenu-button ${currentView === 'topCallOptions' ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick('topCallOptions')}
                >
                  Top Call Options
                </button>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default NavigationMenu;
