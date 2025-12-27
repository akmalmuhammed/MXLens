(module
 (type $0 (func (param i32 i32 i32) (result i32)))
 (memory $0 0)
 (export "determineVerdictWasm" (func $assembly/index/determineVerdictWasm))
 (export "memory" (memory $0))
 (func $assembly/index/determineVerdictWasm (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  local.get $2
  i32.const 1
  i32.and
  if
   i32.const 3
   return
  end
  local.get $2
  i32.const 2
  i32.and
  i32.const 2
  i32.eq
  if
   i32.const 3
   return
  end
  local.get $2
  i32.const 4
  i32.and
  i32.const 4
  i32.eq
  if
   i32.const 3
   return
  end
  local.get $2
  i32.const 8
  i32.and
  i32.const 8
  i32.eq
  if
   i32.const 3
   return
  end
  local.get $0
  i32.const 80
  i32.ge_s
  if
   i32.const 1
   return
  end
  local.get $0
  i32.const 50
  i32.ge_s
  if
   i32.const 2
   return
  end
  i32.const 3
 )
)
