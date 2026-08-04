"use client";

import { AddDomainDialog } from "./add-domain-dialog";
import { EditDomainDialog } from "./edit-domain-dialog";
import { RemoveDomainDialog } from "./remove-domain-dialog";
import { RunScanDialog } from "./run-scan-dialog";

export function DialogContainer() {
  return (
    <>
      <AddDomainDialog />
      <EditDomainDialog />
      <RemoveDomainDialog />
      <RunScanDialog />
    </>
  );
}
