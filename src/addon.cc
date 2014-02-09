#include <nan.h>
#include <list>
#include <algorithm>

using namespace v8;

static Persistent<FunctionTemplate> constructor;

class EOLFinder : public node::ObjectWrap {


  Persistent<Function> m_onNewLine;

  size_t offsetFromBeginning;
  size_t sizeWithoutNewline;
  int chunksWithoutNewline;
  explicit EOLFinder() : offsetFromBeginning(0), sizeWithoutNewline(0),
    chunksWithoutNewline(0) {

  }

  typedef std::pair<const char*, size_t> chunk_type;
  typedef std::list<chunk_type> chunk_list;
  chunk_list chunks;

  void AddChunk(const char* chunk, size_t siz) {
    // for C++11 could be emplace_back
    chunks.push_back(chunk_type(chunk, siz));
  }


  int ProcessLines() {
    int foundCount = 0;
    
    assert(chunks.size() > 0);

    chunk_type last = chunks.back();
    
    const char* begin = last.first;
    size_t siz = last.second;

    do {
      const char* found = (const char*)memchr(begin, 10, siz);
      if(found) {
        size_t foundSiz = (found - begin);
        size_t tillEnd = siz - foundSiz - 1;
        
        Local<Function> onNewLine = NanPersistentToLocal(m_onNewLine);
        sizeWithoutNewline += foundSiz;

        if(chunksWithoutNewline > 0) {
          Handle<Value> args[1] = {NanNewBufferHandle(sizeWithoutNewline)};
          char* targetData = node::Buffer::Data(args[0]);

          size_t chunksOffset = 0;
          // iterate over all chunks except one
          //   - copy chunks 
          for(chunk_list::iterator i = chunks.begin();i != --chunks.end();++i) {
            chunk_type chunk = *i;
            memcpy(targetData + chunksOffset, chunk.first + offsetFromBeginning, chunk.second - offsetFromBeginning);
            chunksOffset += chunk.second - offsetFromBeginning;
            offsetFromBeginning = 0; // offset is valid for first chunk only
          }
          // copy over last chunk
          memcpy(targetData + chunksOffset, begin, foundSiz);
          chunksOffset += foundSiz;

          onNewLine->Call(Context::GetCurrent()->Global(), 1, args);
        }
        else { // whole line is inside buffer
          Handle<Value> args[1] = {NanNewBufferHandle((char*)begin, foundSiz)};
          onNewLine->Call(Context::GetCurrent()->Global(), 1, args);
        }
        foundCount++;

        begin = found + 1;
        siz = tillEnd;

        if(foundCount == 1)
          offsetFromBeginning = foundSiz + 1;
        else
          offsetFromBeginning += foundSiz + 1;


        chunksWithoutNewline = 0;
        sizeWithoutNewline = 0;

      }
      else {
        if(siz) {
          sizeWithoutNewline += siz;
          chunksWithoutNewline++;
        }
        break;
      }

    } while(1);

    return foundCount;
  }

  static NAN_METHOD(New) {
    NanScope();
    EOLFinder* finder = new EOLFinder();
    finder->Wrap(args.This());

    args.This()->Set(String::NewSymbol("buffers"), Array::New());

    NanAssignPersistent(Function, finder->m_onNewLine, Handle<Function>::Cast(args[0]));

    NanReturnValue(args.This());
  }

  static NAN_METHOD(Add) {
    NanScope();
    EOLFinder* self = ObjectWrap::Unwrap<EOLFinder>(args.This());

    Local<Array> buffers = Local<Array>::Cast(args.This()->Get(String::NewSymbol("buffers")));

    if(args.Length() > 0 && node::Buffer::HasInstance(args[0])) {
      char* data = node::Buffer::Data(args[0]);
      size_t siz = node::Buffer::Length(args[0]);

      buffers->Set(buffers->Length(), args[0]);
      self->AddChunk(data, siz);

      if(self->ProcessLines()) {
        chunk_type lastInternal = self->chunks.back();
        self->chunks.clear();
        self->chunks.push_back(lastInternal);

        Local<Value> last = buffers->Get(buffers->Length() - 1);
        buffers = Array::New();
        args.This()->Set(String::NewSymbol("buffers"), buffers);
        buffers->Set(0, last);
      }
    }
    NanReturnValue(Undefined());
  }

  // actual destructor
  virtual ~EOLFinder() {
    NanDisposePersistent(m_onNewLine);
  }

public:
  static void Init () {
    Local<FunctionTemplate> tpl = FunctionTemplate::New(EOLFinder::New);
    NanAssignPersistent(FunctionTemplate, constructor, tpl);
    tpl->SetClassName(NanSymbol("EOLFinder"));
    tpl->InstanceTemplate()->SetInternalFieldCount(1);
    NODE_SET_PROTOTYPE_METHOD(tpl, "add", EOLFinder::Add);
  }
};


void Init(Handle<Object> exports, Handle<Object> module) {
  EOLFinder::Init();
  v8::Local<v8::FunctionTemplate> constructorHandle =
      NanPersistentToLocal(constructor);

  module->Set(String::NewSymbol("exports"),constructorHandle->GetFunction());
}

NODE_MODULE(eol, Init)