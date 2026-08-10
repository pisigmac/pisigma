#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/Tools/shell-lib/common.sh"

for dir in */;do 
	if [[ "$dir" == "docs/" || "$dir" == "node_modules/" || "$dir" == "Tools/" ]]; then continue; fi
	echo "working module is ${dir}";
	pisigma_test_all "${ROOT}/${dir}"
done

