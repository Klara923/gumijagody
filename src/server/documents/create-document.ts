import type { CreateDocumentInput } from './schemas'
import { insertDocumentInTransaction } from './insert-document'

export async function createDocument(input: CreateDocumentInput) {
  return insertDocumentInTransaction({
    number: input.number,
    typeId: input.typeId,
    contractor: input.contractor,
    contractorId: input.contractorId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    netAmount: input.netAmount,
    vatAmount: input.vatAmount,
    grossAmount: input.grossAmount,
    currency: input.currency,
    paymentAccount: input.paymentAccount,
    categoryId: input.categoryId,
    source: 'MANUAL',
    stage: 'ACCEPTED',
    acceptedAt: new Date(),
  })
}
