import HomePage from './HomePage';
import UserImportForm from './components/UserImportForm';
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  // No need to pass cookies to createClient, just call it with no arguments
  const supabase = await createClient();

  const { data: todos } = await supabase.from('todos').select();

  return (
    <div>
      <div className='pb-1 px-3'>
        <HomePage/>
        <UserImportForm/>
        {/* <SignUpForm/> */}
      </div>
      <div>
      </div>
      <ul>
      {todos?.map((todo, idx) => (
        <li key={todo.id ?? idx}>{JSON.stringify(todo)}</li>
      ))}
    </ul>
    </div>
  );
}