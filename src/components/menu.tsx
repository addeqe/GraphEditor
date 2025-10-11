import React, { useState, useEffect, useRef } from 'react';
import {
  Grid, BarChart2, Download, Upload, Trash2, Settings, Droplet, Edit, PlusCircle, Search, Filter, GitMerge, Save, RotateCcw, RotateCw
} from 'react-feather';
import './Menu.css';

// Definierar typerna för alla funktioner och variabler som komponenten behöver från App.tsx
type MenuProps = {
  // Graph props
  selectedGraphType: string;
  handleGraphTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  importAndSave: () => void;
  handleExportCsv: () => void;
  cleargraph: () => void;
  isSnapGridDisabled: boolean;
  setIsSnapGridDisabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  handleSave: () => void;
  handleUndo: () => void;
  handleRedo: () => void;

  // Edge props
  selectedEdgeColor: string;
  setSelectedEdgeColor: (color: string) => void;
  changeSelectedEdgeColor: (color: string) => void;
  selectedEdgeWeight: number;
  setSelectedEdgeWeight: (weight: number) => void;
  isInputDisabled: boolean;
  setIsInputDisabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  changeSelectedEdgeWeight: (weight: number) => void;

  // Node props
  addNode: () => void;
  addNrOfNodes: () => void;
  nrOfNodes: number;
  setNrOfNodes: (num: number) => void;
  changeLabel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedNode: { data: { label: string } } | null;

  // Analyze props
  startPathfinding: () => void;
  selectedNodeSearch: string;
  setSelectedNodeSearch: (value: string) => void;
};

const Menu: React.FC<MenuProps> = (props) => {
  // Håller koll på vilken meny som är öppen (t.ex. 'graph', 'edge')
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Håller koll på texten i "Rename Node"-fältet för en smidig användarupplevelse
  const [renameInput, setRenameInput] = useState('');

  // Effekt för att stänga menyn om man klickar utanför den
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Effekt för att synkronisera "Rename Node"-fältet med den valda noden
  useEffect(() => {
    setRenameInput(props.selectedNode?.data?.label || '');
  }, [props.selectedNode]);
  
  // Funktion för att öppna/stänga en meny
  const handleMenuToggle = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  return (
    <div className="menu-bar" ref={menuRef}>
      {/* --- GRAPH MENU --- */}
      <div className="menu-item">
        <button className="menu-button" onClick={() => handleMenuToggle('graph')}><Grid size={16} /> Graph</button>
        <div className={`submenu ${openMenu === 'graph' ? 'is-open' : ''}`}>
          <div className="submenu-item">
            <label>Graph Type:</label>
            <select value={props.selectedGraphType} onChange={props.handleGraphTypeChange}>
              <option value="manual">Manual</option>
              <option value="forceDirected">Force Directed</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="circular">Circular</option>
            </select>
          </div>
          <button className="submenu-button" onClick={props.importAndSave}><Upload size={14} /> Import CSV</button>
          <button className="submenu-button" onClick={props.handleExportCsv}><Download size={14} /> Download Graph</button>
          <button className="submenu-button" onClick={props.cleargraph}><Trash2 size={14} /> Clear Graph</button>
          <button className="submenu-button" onClick={() => props.setIsSnapGridDisabled(prev => !prev)}>
            <Settings size={14} /> {props.isSnapGridDisabled ? "Snap Grid: On" : "Snap Grid: Off"}
          </button>
          <div className="submenu-separator" />
          <button className="submenu-button" onClick={props.handleSave}><Save size={14} /> Save</button>
          <button className="submenu-button" onClick={props.handleUndo}><RotateCcw size={14} /> Undo</button>
          <button className="submenu-button" onClick={props.handleRedo}><RotateCw size={14} /> Redo</button>
        </div>
      </div>

      {/* --- EDGE MENU --- */}
      <div className="menu-item">
        <button className="menu-button" onClick={() => handleMenuToggle('edge')}><GitMerge size={16} /> Edge</button>
        <div className={`submenu ${openMenu === 'edge' ? 'is-open' : ''}`}>
          <div className="submenu-item">
            <label>Edge Color:</label>
            <select value={props.selectedEdgeColor} onChange={(e) => props.setSelectedEdgeColor(e.target.value)}>
                <option value="default">Default</option><option value="dark">Dark</option><option value="red">Red</option><option value="orange">Orange</option><option value="yellow">Yellow</option><option value="green">Green</option><option value="teal">Teal</option><option value="blue">Blue</option><option value="purple">Purple</option><option value="pink">Pink</option>
            </select>
          </div>
          <button className="submenu-button" onClick={() => props.changeSelectedEdgeColor(props.selectedEdgeColor)}><Droplet size={14} /> Change Color</button>
          <div className="submenu-item">
            <label>Edge Weight:</label>
            <input 
              type="number" 
              className="submenu-input"
              value={props.selectedEdgeWeight} 
              onChange={(e) => props.setSelectedEdgeWeight(Number(e.target.value))}
              disabled={props.isInputDisabled}
            />
          </div>
          <button className="submenu-button" onClick={() => props.setIsInputDisabled(prev => !prev)}>
            {props.isInputDisabled ? "Activate Input" : "Deactivate Input"}
          </button>
          <button className="submenu-button" onClick={() => props.changeSelectedEdgeWeight(props.selectedEdgeWeight)}><Edit size={14} /> Change Weight</button>
        </div>
      </div>

      {/* --- NODE MENU --- */}
      <div className="menu-item">
        <button className="menu-button" onClick={() => handleMenuToggle('node')}><PlusCircle size={16} /> Node</button>
        <div className={`submenu ${openMenu === 'node' ? 'is-open' : ''}`}>
          <button className="submenu-button" onClick={props.addNode}><PlusCircle size={14} /> Add Node</button>
          <div className="submenu-item">
            <input type="number" min="0" className="submenu-input" value={props.nrOfNodes} onChange={(e) => props.setNrOfNodes(Number(e.target.value))} />
            <button className="submenu-button" onClick={props.addNrOfNodes}>Add {props.nrOfNodes} Nodes</button>
          </div>
           <div className="submenu-item">
             <label>Rename Node:</label>
            <input 
              type="text" 
              className="submenu-input" 
              value={renameInput}
              onChange={(e) => {
                setRenameInput(e.target.value); // Uppdatera lokal state för snabb respons
                props.changeLabel(e);           // Skicka ändringen till App.tsx
              }}
            />
          </div>
        </div>
      </div>
      
      {/* --- ANALYZE MENU --- */}
      <div className="menu-item">
        <button className="menu-button" onClick={() => handleMenuToggle('analyze')}><BarChart2 size={16} /> Analyze</button>
        <div className={`submenu ${openMenu === 'analyze' ? 'is-open' : ''}`}>
          <button className="submenu-button" onClick={props.startPathfinding}><GitMerge size={14} /> Shortest Path</button>
          <div className="submenu-item">
             <label>Search:</label>
             <input type="text" className="submenu-input" value={props.selectedNodeSearch} onChange={(e) => props.setSelectedNodeSearch(e.target.value)} />
          </div>
           <div className="submenu-item">
             <label>Filter:</label>
             <select>
                <option value="default">None</option>
                <option value="node">Node</option>
                <option value="edge">Edge</option>
             </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;