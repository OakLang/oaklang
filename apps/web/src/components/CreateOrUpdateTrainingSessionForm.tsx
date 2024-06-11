// import { useSession } from 'next-auth/react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { Button } from './ui/button';
// import { Loader2, XIcon } from 'lucide-react';
// import { toast } from 'sonner';
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
// import { Input } from './ui/input';
// import { useCallback, useRef, useState } from 'react';
// import { Label } from './ui/label';
// import { Badge } from './ui/badge';
// import pluralize from 'pluralize';
// import { Switch } from './ui/switch';
// import type { PublicTrainingSession } from '~/utils/types';
// import ExtractLexicondsAndPhrasesFromParagraphDialog from './ExtractWordsAndPhrasesFromParagraphDialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// export default function CreateOrUpdateTrainingSessionForm({
//   update,
//   onSuccess,
// }: {
//   onSuccess: (session: PublicTrainingSession) => void;
//   update?: PublicTrainingSession;
// }) {
//   const [isLoading, setIsLoading] = useState(false);
//   const session = useSession({ required: true });
//   const form = useForm<CreateTrainingSessionInput>({
//     defaultValues: {
//       languageId: 'en',
//       numberOfLexiconsToTrain: 0,
//       numberOfTimesToRepeat: 0,
//       numberOfTimesToTrain: 0,
//       percentKnown: 0,
//       relatedPrecursor: false,
//       sentenceLength: null,
//       ...(update ?? {}),
//       lexicons: update ? update.lexicons.map((lexicon) => lexicon.lexicon) : [],
//     },
//     resolver: zodResolver(createTrainingSessionInput),
//   });
//   const [lexiconsInputText, setLexiconsInputText] = useState('');
//   const lexiconsInputFieldRef = useRef<HTMLInputElement>(null);
//   const [showExtractWordsModal, setShowExtracLexiconsModal] = useState(false);
//   const lexicons = form.watch('lexicons');

//   const languages = api.languages.getLanguages.useQuery();

//   const createSessionMut = api.trainingSessions.createTrainingSession.useMutation({
//     onError: (error) => {
//       toast('Failed to create Training Session', { description: error.message });
//     },
//     onMutate: () => {
//       setIsLoading(true);
//     },
//     onSettled: () => {
//       setIsLoading(false);
//     },
//     onSuccess,
//   });
//   const updateSessionMut = api.trainingSessions.updateTrainingSession.useMutation({
//     onError: (error) => {
//       toast('Failed to update Training Session', { description: error.message });
//     },
//     onMutate: () => {
//       setIsLoading(true);
//     },
//     onSettled: () => {
//       setIsLoading(false);
//     },
//     onSuccess,
//   });

//   const addLexicons = useCallback(
//     (newLexicons: string[]) => {
//       const uniqueLexicons = newLexicons.filter((lexicon) => !lexicons.includes(lexicon));
//       form.setValue('lexicons', [...lexicons, ...uniqueLexicons]);
//       toast(`${uniqueLexicons.length} new unique ${pluralize('lexicon', uniqueLexicons.length)} added to the list.`);
//     },
//     [form, lexicons],
//   );

//   const handleExtractLexicons = useCallback(() => {
//     const lexicons = extractComaSeperatedLexicons(lexiconsInputText);
//     addLexicons(lexicons);
//     setLexiconsInputText('');
//     lexiconsInputFieldRef.current?.blur();
//   }, [addLexicons, lexiconsInputText]);

//   const handleSubmit = useCallback(
//     (data: CreateTrainingSessionInput) => {
//       if (update) {
//         updateSessionMut.mutate({ ...data, id: update.id });
//       } else {
//         createSessionMut.mutate(data);
//       }
//     },
//     [createSessionMut, update, updateSessionMut],
//   );

//   if (session.status === 'loading') {
//     return <p>Loading...</p>;
//   }

//   return (
//     <>
//       <Form {...form}>
//         <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
//           <FormField
//             control={form.control}
//             name="languageId"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Language</FormLabel>
//                 <FormControl>
//                   <Select
//                     {...field}
//                     onValueChange={(value) => {
//                       form.setValue(field.name, value);
//                     }}
//                     value={field.value}
//                   >
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {languages.data?.map((item) => (
//                         <SelectItem key={item.id} value={item.id}>
//                           {item.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="numberOfTimesToRepeat"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Number of times to repeat</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="number"
//                     {...field}
//                     onChange={(e) => {
//                       const value = parseInt(e.currentTarget.value);
//                       form.setValue(field.name, value);
//                     }}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="numberOfTimesToTrain"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Number of times to train</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="number"
//                     {...field}
//                     onChange={(e) => {
//                       const value = parseInt(e.currentTarget.value);
//                       form.setValue(field.name, value);
//                     }}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="numberOfLexiconsToTrain"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Number of lexicons to train</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="number"
//                     {...field}
//                     onChange={(e) => {
//                       const value = parseInt(e.currentTarget.value);
//                       form.setValue(field.name, value);
//                     }}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="percentKnown"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Percent Known</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="number"
//                     {...field}
//                     onChange={(e) => {
//                       const value = parseFloat(e.currentTarget.value);
//                       form.setValue(field.name, value);
//                     }}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="relatedPrecursor"
//             render={({ field: { value, onChange: _, ...field } }) => (
//               <FormItem className="flex items-center justify-between">
//                 <FormLabel>Related Precursor</FormLabel>
//                 <FormControl>
//                   <Switch checked={value} onCheckedChange={() => form.setValue(field.name, !value)} {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <div className="space-y-2">
//             <Label htmlFor="lexicons-input">
//               Lexicons{lexicons.length > 0 ? ` (${lexicons.length.toFixed()} ${pluralize('lexicon', lexicons.length)})` : null}
//             </Label>
//             <div className="flex flex-wrap gap-2">
//               {lexicons.length === 0 ? (
//                 <p className="text-sm text-muted-foreground">No lexicons...</p>
//               ) : (
//                 lexicons.map((lexicon) => (
//                   <Badge key={lexicon} variant="outline">
//                     {lexicon}
//                     <Button
//                       className="-mr-2 ml-0.5 h-6 w-6 rounded-full"
//                       onClick={() =>
//                         form.setValue(
//                           'lexicons',
//                           lexicons.filter((w) => w !== lexicon),
//                         )
//                       }
//                       size="icon"
//                       type="button"
//                       variant="ghost"
//                     >
//                       <XIcon className="h-4 w-4" />
//                     </Button>
//                   </Badge>
//                 ))
//               )}
//             </div>
//             <div className="flex gap-2">
//               <Input
//                 className="flex-1"
//                 id="lexicons-input"
//                 onChange={(e) => setLexiconsInputText(e.currentTarget.value)}
//                 onKeyDown={(e) => {
//                   if (e.code === 'Enter') {
//                     e.preventDefault();
//                     handleExtractLexicons();
//                   }
//                 }}
//                 placeholder="Dog, Cat, Piece of cake, ..."
//                 ref={lexiconsInputFieldRef}
//                 value={lexiconsInputText}
//               />
//               <Button onClick={handleExtractLexicons} type="button">
//                 Add All
//               </Button>
//             </div>
//             <Button className="h-fit p-0" onClick={() => setShowExtracLexiconsModal(true)} type="button" variant="link">
//               Extract lexicons from paragraph
//             </Button>
//           </div>
//           <Button disabled={isLoading} type="submit">
//             {isLoading ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : null}
//             {update ? 'Save' : 'Start Session'}
//           </Button>
//         </form>
//       </Form>

//       <ExtractLexicondsAndPhrasesFromParagraphDialog
//         onComplete={addLexicons}
//         onOpenChange={setShowExtracLexiconsModal}
//         open={showExtractWordsModal}
//       />
//     </>
//   );
// }
