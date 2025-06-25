# ZiroDeltaEmergency.sol

## Overview

This contract handles circuit breakers and emergency procedures for the ZiroDelta Protocol.
It uses an access control mechanism to grant pauser and unpauser roles.

## Functions

### `pause()`

Pauses the system in case of an emergency.

### `unpause()`

Unpauses the system when the emergency is resolved.
