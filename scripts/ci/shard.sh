#!/usr/bin/env bash
# Prints the frame range for shard i of n within "A-B":  shard.sh A-B i n
A=${1%-*}; B=${1#*-}; I=$2; N=$3; C=$((B - A + 1))
S=$((A + I * C / N)); E=$((A + (I + 1) * C / N - 1))
[ "$E" -ge "$S" ] && echo "$S-$E" || echo ""
