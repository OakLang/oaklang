// import { zodResolver } from '@hookform/resolvers/zod';
// import React, { useCallback, useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { z } from 'zod';
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
// import { Textarea } from './ui/textarea';
// import { api } from '~/trpc/client';
// import { Button } from './ui/button';
// import { Loader2, XIcon } from 'lucide-react';
// import { Badge } from './ui/badge';
// import { toast } from 'sonner';
// import { extractWords as extractLexicons } from '~/utils/helpers';
// import pluralize from 'pluralize';
// import type { TRPCError } from '@trpc/server';

// const schema = z.object({
//   paragraph: z.string().max(2000),
// });

// export default function ExtractLexicondsAndPhrasesFromParagraphDialog({
//   onOpenChange,
//   open,
//   onComplete,
// }: {
//   onComplete?: (lexcions: string[]) => void;
//   onOpenChange?: (value: boolean) => void;
//   open?: boolean;
// }) {
//   const [lexicons, setLexicons] = useState<string[]>([]);
//   const [isExtracting, setIsExtracting] = useState(false);
//   const form = useForm<z.infer<typeof schema>>({
//     defaultValues: {
//       paragraph: '',
//     },
//     resolver: zodResolver(schema),
//   });
//   const extractLexiconsMut = api.ai.extractLexicons.useMutation();

//   const handleSubmit = useCallback(
//     async (data: z.infer<typeof schema>) => {
//       setIsExtracting(true);
//       try {
//         const extractedLexicons = await extractLexiconsMut.mutateAsync(data.paragraph);
//         setLexicons(extractedLexicons);
//         toast(`${extractLexicons.length} new ${pluralize('lexicon', extractLexicons.length)} extracted from the paragraph`);
//       } catch (error: unknown) {
//         toast('Failed to extract', { description: (error as TRPCError).message });
//       } finally {
//         setIsExtracting(false);
//       }
//     },
//     [extractLexiconsMut],
//   );

//   return (
//     <Dialog onOpenChange={onOpenChange} open={open}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Extract Lexicons from Paragraph</DialogTitle>
//         </DialogHeader>
//         {lexicons.length === 0 ? (
//           <Form {...form}>
//             <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
//               <FormField
//                 control={form.control}
//                 name="paragraph"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Paragraph</FormLabel>
//                     <FormControl>
//                       <Textarea {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <Button disabled={isExtracting}>
//                 {isExtracting ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : null}
//                 Extract
//               </Button>
//             </form>
//           </Form>
//         ) : (
//           <div className="space-y-4">
//             <div className="flex flex-wrap gap-2">
//               {lexicons.map((lexicon) => (
//                 <Badge key={lexicon} variant="outline">
//                   {lexicon}
//                   <Button
//                     className="-mr-2 ml-0.5 h-6 w-6 rounded-full"
//                     onClick={() => setLexicons((lexicons) => lexicons.filter((l) => l !== lexicon))}
//                     size="icon"
//                     type="button"
//                     variant="ghost"
//                   >
//                     <XIcon className="h-4 w-4" />
//                   </Button>
//                 </Badge>
//               ))}
//             </div>

//             <Button
//               onClick={() => {
//                 onOpenChange?.(false);
//                 onComplete?.(lexicons);
//                 setLexicons([]);
//                 form.reset();
//               }}
//             >
//               Add Lexicons
//             </Button>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }
