
declare type Instrumentor = 'minimal' | 'thorough';

declare type Insertion = {
  id: number,
  node: Object,
  context: string,
  type: string,
};

declare type Executor = 'node' | 'browser';

declare type ExecutionSuccess = { error: {} };

declare type ExecutionError = { finish: true };

declare type NullableLocation = { line: ?number, column?: ?number };

declare type NodeModule = {
  require: (module: string) => any,
  exports: Object,
};

declare type TransformError = {|
  insertions: null,
  map: null,
  code: null,
  source: string,
  error: any,
  originalError: Error,
|};

declare type TransformSuccess = {|
  insertions: Insertion[],
  map: {},
  code: string,
  source: string,
  error: null,
  originalError: null,
|};
