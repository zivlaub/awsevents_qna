import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function fetchData(textareaValue :string,  check_mode:string ,  check_results :string, check_sentences:string , check_threshold:string ) {
	return async () => {
		try {
			const res = await fetch(
				`https://jsonplaceholder.typicode.com/posts/1`
			);
			const data = await res.json();
			console.log(data);
      
      //return data
		} catch (err) {
			console.log(err);
		}
	};
}


interface Row {
  page_url: string
  page_title: string
  content: string

}

  
interface Sources {
  page_url: string
  page_title: string
  content: string

}
export async function fetchData1(textareaValue :string, setTextareaValueSystemPrompt :string, check_mode:string , check_model:string , check_results :string, check_sentences:string , check_threshold:string ) {
	console.log(textareaValue)
  // var model = 'unsupported_model'
  // if(check_model=='2'){model='openai'}
  // if(check_model=='1'){model='bedrock.titan'}
  var body = {
    'prompt':textareaValue,
    'system_prompt': setTextareaValueSystemPrompt,
    'similarity_threshold': check_threshold,
    'results': check_results,
    'sentences': check_sentences,
    'backend': check_model
  }
		try {
			const res = await fetch(
				'https://d8az0r49rv36e.cloudfront.net/search', {//search //searchdummy
          method: 'POST',
          headers: {
            'content-type': 'application/json;charset=UTF-8',
          },
          body: JSON.stringify(body),
        });
			var data = await res.json();
    
		 console.log(data);
          
      return data
		} catch (err) {
			console.log(err);
		}

}