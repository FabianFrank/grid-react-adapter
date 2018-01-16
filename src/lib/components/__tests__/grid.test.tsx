import * as React from 'react';

import { IRowColDescriptor } from 'grid';
import * as grid from 'grid';

import _merge = require('lodash/merge');

const mockReactDomRender = jest.fn();
jest.mock('react-dom', () => ({
  render: mockReactDomRender
}));

const mockDataSet = jest.fn();
const mockDataGet = jest.fn();
const makeDescriptor = (): Partial<IRowColDescriptor> => {
  const mockRowColDescriptor = {};
  Object.defineProperty(mockRowColDescriptor, 'data', {
    get: mockDataGet,
    set: mockDataSet,
  });
  return mockRowColDescriptor;
};
const mockDim = () => ({
  converters: {
    data: {
      get: jest.fn(makeDescriptor)
    }
  },
  rowColModel: {
    clear: jest.fn(),
    add: jest.fn(),
    create: jest.fn(makeDescriptor)
  }
});
const mockRowDim = mockDim();
const mockColDim = _merge({}, mockDim(), { rowColModel: { col: jest.fn() } });
const mockDataSetDirty = jest.fn();
const mockGridBuild = jest.fn((o: any) => ({}));
const mockGridCreate = jest.fn((o: any) => ({
  build: mockGridBuild,
  rows: mockRowDim,
  cols: mockColDim,
  colModel: {
    createBuilder: (render: any, update: any): any => ({
      render, update
    })
  },
  dataModel: {
    setDirty: mockDataSetDirty
  }
}));
(grid.create as any) = mockGridCreate;

import { mount, shallow } from 'enzyme';
import { ReactGrid } from '../grid';

beforeEach(() => {
  mockGridCreate.mockClear();
  mockGridBuild.mockClear();
  mockRowDim.converters.data.get.mockClear();
  mockRowDim.rowColModel.clear.mockClear();
  mockRowDim.rowColModel.add.mockClear();
  mockRowDim.rowColModel.create.mockClear();
  mockColDim.converters.data.get.mockClear();
  mockColDim.rowColModel.clear.mockClear();
  mockColDim.rowColModel.add.mockClear();
  mockColDim.rowColModel.create.mockClear();
  mockDataSetDirty.mockClear();
  mockDataGet.mockClear();
  mockDataSet.mockClear();
});

it('should render', () => {
  const reactGrid = shallow(
    <ReactGrid rows={[]} cols={[]} />
  );
  expect(reactGrid).toMatchElement(<div />);
});

it('should create a container for the grid', () => {
  const reactGrid = mount(
    <ReactGrid rows={[]} cols={[]} />
  );
  const gridContainer = reactGrid.children().getDOMNode().firstElementChild as HTMLElement;
  expect(gridContainer).toBeDefined();
  if (gridContainer) {
    expect(gridContainer.style.position).toBe('absolute');
    expect(gridContainer.style.top).toBe('0px');
    expect(gridContainer.style.left).toBe('0px');
    expect(gridContainer.style.width).toBe('100%');
    expect(gridContainer.style.height).toBe('100%');
  }
});

it('should keep the container in the DOM on subsequent updates', () => {
  const reactGrid = mount(
    <ReactGrid rows={[]} cols={[]} />
  );
  expect(reactGrid.children().getDOMNode().firstElementChild).toBeDefined();
  reactGrid.setProps({ rows: [{}], cols: [] });
  expect(reactGrid.children().getDOMNode().firstElementChild).toBeDefined();
});

it('should create a grid with opts', () => {
  const reactGrid = shallow(
    <ReactGrid rows={[]} cols={[]} snapToCell={true} />
  );
  expect(mockGridCreate).toHaveBeenCalledWith({ snapToCell: true });
});

it('should build a grid with the container', () => {
  const reactGrid = shallow(
    <ReactGrid rows={[]} cols={[]} />
  );
  expect(mockGridBuild).toHaveBeenCalledWith((reactGrid.instance() as ReactGrid).gridContainer);
});

it('should add the supplied rows and cols to the grid', () => {
  const rows = [{ header: true }, { height: 4 }];
  const cols = [{ fixed: true }, { width: 4 }];
  const reactGrid = shallow(
    <ReactGrid rows={rows} cols={cols} />
  );
  expect(mockRowDim.rowColModel.add.mock.calls[0][0]).toMatchObject(rows);
  expect(mockColDim.rowColModel.add.mock.calls[0][0]).toMatchObject(cols);
});

it('should not call add if the supplied rows and cols havent changed functionally', () => {
  const rows = [{ header: true }, { height: 4 }];
  const cols = [{ fixed: true }, { width: 4 }];
  const reactGrid = shallow(
    <ReactGrid rows={rows} cols={cols} />
  );
  mockRowDim.rowColModel.add.mockClear();
  mockColDim.rowColModel.add.mockClear();
  reactGrid.setProps({
    rows: JSON.parse(JSON.stringify(rows)),
    cols: JSON.parse(JSON.stringify(cols))
  });
  expect(mockRowDim.rowColModel.add).not.toHaveBeenCalled();
  expect(mockColDim.rowColModel.add).not.toHaveBeenCalled();
});

it('should not call add if the supplied rows and cols havent changed ref', () => {
  const rows = [{ header: true }, { height: 4 }];
  const cols = [{ fixed: true }, { width: 4 }];
  const reactGrid = shallow(
    <ReactGrid rows={rows} cols={cols} />
  );
  mockRowDim.rowColModel.add.mockClear();
  mockColDim.rowColModel.add.mockClear();
  reactGrid.setProps({
    rows,
    cols
  });
  expect(mockRowDim.rowColModel.add).not.toHaveBeenCalled();
  expect(mockColDim.rowColModel.add).not.toHaveBeenCalled();
});

it('should supply data to the grid', () => {
  const dataRow1 = [{ value: undefined, formatted: '1' }, { value: undefined, formatted: '2' }];
  const dataRow2 = [{ value: undefined, formatted: '3' }, { value: undefined, formatted: '4' }];
  const reactGrid = shallow(
    <ReactGrid
      rows={[{}, {}]}
      cols={[{}, {}]}
      data={[
        dataRow1,
        dataRow2
      ]}
    />
  );
  expect(mockRowDim.converters.data.get).toHaveBeenCalledWith(0);
  expect(mockRowDim.converters.data.get).toHaveBeenCalledWith(1);
  expect(mockDataSet).toHaveBeenCalledWith(dataRow1);
  expect(mockDataSet).toHaveBeenCalledWith(dataRow2);
});

it('should re-supply data to the grid IFF the ref has changed', () => {
  const dataRow1 = [{ value: undefined, formatted: '1' }, { value: undefined, formatted: '2' }];
  const dataRow2 = [{ value: undefined, formatted: '3' }, { value: undefined, formatted: '4' }];
  const rows = [{}, {}];
  const cols = [{}, {}];
  const reactGrid = shallow(
    <ReactGrid
      rows={rows}
      cols={cols}
      data={[
        dataRow1,
        dataRow2
      ]}
    />
  );
  mockRowDim.converters.data.get.mockClear();
  mockDataSet.mockClear();
  const data = [dataRow1, dataRow2];
  reactGrid.setProps({ data, rows, cols });
  expect(mockRowDim.converters.data.get).toHaveBeenCalledWith(0);
  expect(mockRowDim.converters.data.get).toHaveBeenCalledWith(1);
  expect(mockDataSet).toHaveBeenCalledWith(dataRow1);
  expect(mockDataSet).toHaveBeenCalledWith(dataRow2);
  mockRowDim.converters.data.get.mockClear();
  mockDataSet.mockClear();
  reactGrid.setProps({ data, rows, cols });
  expect(mockRowDim.converters.data.get).not.toHaveBeenCalled();
  expect(mockDataSet).not.toHaveBeenCalled();
});

it('should use a colBuilder to supply React rendered content to the grid via cellRenderer prop', () => {
  const rows = [{ header: true }, { height: 4 }];
  const cols = [{ fixed: true }, { width: 4 }];
  const a = <a />;
  const cellRenderer = jest.fn().mockReturnValue(a);
  const reactGrid = mount(
    <ReactGrid rows={rows} cols={cols} cellRenderer={cellRenderer} />
  );
  const gridCols = mockColDim.rowColModel.add.mock.calls[0][0];
  const cellRendererBuilder = gridCols[0].builder;
  const rendered = cellRendererBuilder.render();
  expect(rendered).toBeDefined();
  expect(cellRendererBuilder.update(rendered, { virtualRow: 1, virtualCol: 2, data: { formatted: 'poo' } })).toBe(rendered);
  expect(cellRenderer).toHaveBeenCalledWith(1, 2, { formatted: 'poo' });
  expect(mockReactDomRender).toHaveBeenCalledWith(a, rendered);
});