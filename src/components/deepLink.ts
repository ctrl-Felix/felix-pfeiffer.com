export type Launch = { toolId?: string; domain?: string };

let pending: Launch | undefined;

export const setPendingLaunch = (launch: Launch | undefined) => {
  pending = launch;
};

export const peekPendingLaunch = () => pending;
