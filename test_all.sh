#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

for dir in */;do 
	[ "$dir" == "docs/"  || "$dir" == "node_modules/" ] && continue; 
	echo "working module  is ${dir}";
	pisigma_test_all "${ROOT}/${dir}"
done

